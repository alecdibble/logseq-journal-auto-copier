
import "@logseq/libs";
import type { BlockEntity } from "@logseq/libs/dist/LSPlugin.user";

import { format } from 'date-fns';

let config;

function getTodayString() {
  return format(new Date(), config.preferredDateFormat);
}

function getNthDaysAgoString(n:number) {
  return format(new Date((new Date()).setDate((new Date()).getDate() - n)), config.preferredDateFormat);
}

function isPageTreeEmpty(tree) {
  if(!tree) return true
  if(Array.isArray(tree) && tree.length < 1) return true
  if( tree.length < 2 && (!tree[0].content || tree[0].content === '')) return true;
  if(tree.find(t => t.content !== '')) return false
  return true
}

async function isPageEmpty(pageName) {
  const pageBlockTrees = await logseq.Editor.getPageBlocksTree(pageName)
  return isPageTreeEmpty(pageBlockTrees)
}

async function getLastNonEmptyJournalPage() {
  let counter = 1;
  while(counter < 50) {
    let page = await logseq.Editor.getPage(getNthDaysAgoString(counter));
    if(page) {
      if(!(await isPageEmpty(page.name))) return page.name
    }
    counter += 1;
  }
  //TODO Add flash error to user that no existing journal entries were found
};

async function getTodaysJournalPage() {
  return logseq.Editor.getPage(getTodayString())
}

async function getLastBlock(pageName: string) {
  const blocks = await logseq.Editor.getPageBlocksTree(pageName);
  if (blocks.length === 0) {
    return null;
  }
  return blocks[blocks.length - 1];
}

async function handleChildCopying(uuid, childTree) {
  if(childTree && childTree.length > 0) {
    for(const child of childTree) {
      if(child.content.startsWith('DONE')) continue;
      const block = await logseq.Editor.insertBlock(uuid, (child as BlockEntity).content, {
        sibling: false
      })
      if(child.children) {
        await handleChildCopying(block.uuid, child.children)
      }
    }
  }
}

async function copyPageToTodaysJournalPage(page:string) {
  const todayPage = await getTodaysJournalPage()
  const lastPageTree = await logseq.Editor.getPageBlocksTree(page);

  const lastTodayPageBlock = await getLastBlock(todayPage.name)

  let currentUUID = lastTodayPageBlock.uuid

  for(const [i, pageTreeItem] of lastPageTree.entries()) {
    if(pageTreeItem.content.startsWith('DONE')) continue;
    if(i === 0) {
      await logseq.Editor.updateBlock(currentUUID, pageTreeItem.content)
      if(pageTreeItem.children && pageTreeItem.children.length > 0 && !pageTreeItem.content.includes("Notes")) {
        await handleChildCopying(currentUUID, pageTreeItem.children)
      }
    }
    else {
      const block = await logseq.Editor.insertBlock(currentUUID, pageTreeItem.content, {
        sibling: true
      })
      currentUUID = block.uuid;
      if(pageTreeItem.children && pageTreeItem.children.length > 0 && (!pageTreeItem.content.includes("Notes") && !pageTreeItem.content.includes("TODO"))) {
        await handleChildCopying(currentUUID, pageTreeItem.children)
      }
    }
  }
}

async function handleCron() {
  config = await logseq.App.getUserConfigs();
  let page = await getTodaysJournalPage();
  if(!page) {
    await logseq.Editor.createPage(
      format(new Date(), config.preferredDateFormat),
      {},
      {
        createFirstBlock: true,
        redirect: false,
        journal: true,
      }
    );
  }
  const pageEmptyCheck = await isPageEmpty(page.name)
  if(!pageEmptyCheck) return
  
  const lastPageName:string = await getLastNonEmptyJournalPage();

  await copyPageToTodaysJournalPage(lastPageName)  
}

async function main() {
  await handleCron()
  setInterval(handleCron, 10000);
}

logseq.ready(main).catch(console.error);
