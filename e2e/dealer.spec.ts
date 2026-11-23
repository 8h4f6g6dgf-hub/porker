import {test,expect} from '@playwright/test';
test('rigged dealer loads; failed model still permits the complete introductory lesson',async({page})=>{
 test.setTimeout(60000);
 await page.goto('/');await page.getByRole('button',{name:'演出をスキップ',exact:true}).click();
 await expect(page.locator('canvas')).toHaveAttribute('data-dealer','ready');
 await page.route('**/assets/dealer/dealer.glb',r=>r.abort());
 await page.reload();await expect(page.locator('canvas')).toHaveAttribute('data-dealer','fallback');
 async function advance(phase:string){for(let i=0;i<30&&await page.locator('main').getAttribute('data-phase')!==phase;i++){await page.waitForTimeout(350);await page.locator('.experience-actions button.primary').click();}await expect(page.locator('main')).toHaveAttribute('data-phase',phase);}
 await advance('choose');await page.getByRole('button',{name:/01 \/ LEARN/}).click();
 await advance('reveal');await page.getByRole('button',{name:'手札1をめくる'}).click();await page.getByRole('button',{name:'手札2をめくる'}).click();await page.getByRole('button',{name:'ハンドについて聞く →'}).click();
 await advance('quiz');await page.waitForTimeout(350);await page.locator('.experience-actions button.primary').click();await page.getByRole('button',{name:'2枚',exact:true}).click();await expect(page.getByRole('status')).toContainText('正解');
});
