from pathlib import Path
import json
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parent
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/opt/google/chrome/chrome',headless=True,args=['--no-sandbox','--disable-gpu'],timeout=30000,env={'XDG_CONFIG_HOME':'/tmp/notes-chrome-config','XDG_CACHE_HOME':'/tmp/notes-chrome-cache'})
 page=b.new_page(viewport={'width':1440,'height':1000},offline=True,accept_downloads=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto((R/'index.html').as_uri());page.evaluate('localStorage.removeItem("week2-meeting-notes-v1")');page.reload()
 def create(context,text):
  page.locator('.notes-toggle').click();page.locator('#notes-context').select_option(context);page.locator('#notes-text').fill(text);page.locator('#notes-save').click();page.wait_for_timeout(100)
 create('astra-pacman','Can we distinguish a blocked move from an explicit idle action?')
 assert not page.locator('#meeting-notes').is_visible();assert page.locator('.note-card').is_visible();assert page.locator('.notes-toggle').inner_text()=='+'
 group=page.locator('.notes-group[data-context="astra-pacman"]');box=group.bounding_box();target=page.locator('#astra-pacman').bounding_box();assert box['x']>=target['x']+target['width'];assert abs(box['y']-target['y'])<50
 create('astra-pacman','Try a longer clip with a visible collision.');cards=page.locator('.note-card');a=cards.nth(0).bounding_box();c=cards.nth(1).bounding_box();assert c['y']>=a['y']+a['height']
 page.reload();assert page.locator('.note-card').count()==2;assert not page.locator('#meeting-notes').is_visible()
 page.locator('.note-card').first.get_by_role('button',name='Edit',exact=True).click();page.locator('#notes-text').fill('Compare predicted and observed trajectories.');page.locator('#notes-save').click();assert 'Compare predicted' in page.locator('.note-card').first.inner_text()
 page.locator('.note-card').first.get_by_role('button',name='Delete',exact=True).click();assert page.locator('.note-card').count()==1;page.get_by_role('button',name='Undo',exact=True).click();assert page.locator('.note-card').count()==2
 page.locator('#astra-pacman').scroll_into_view_if_needed();page.wait_for_timeout(100);page.screenshot(path=str(R/'validation/notes-desktop.png'))
 page.locator('.notes-toggle').click();page.locator('#notes-text').fill('Unfinished idea');page.keyboard.press('Escape');page.reload();page.locator('.notes-toggle').click();assert page.locator('#notes-text').input_value()=='Unfinished idea';page.locator('#notes-text').fill('')
 for ext,button in [('md','#notes-md'),('json','#notes-json')]:
  with page.expect_download() as d:page.locator(button).click()
  assert 'Compare predicted' in Path(d.value.path()).read_text()
 page.locator('#notes-cancel').click();page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(100);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');group=page.locator('.notes-group[data-context="astra-pacman"]');assert 'notes-inline' in group.get_attribute('class');group.scroll_into_view_if_needed();page.screenshot(path=str(R/'validation/notes-mobile.png'))
 page.evaluate('()=>{Storage.prototype.setItem=function(){throw new Error("Unavailable")}}');create('astra-angry-birds','<script>window.injected=true</script>');assert page.locator('.notes-toast').get_attribute('data-error')=='true';assert not page.evaluate('window.injected===true');assert page.locator('.note-card').count()==3
 page.locator('.notes-toggle').click()
 with page.expect_download() as d:page.locator('#notes-json').click()
 assert 'window.injected=true' in Path(d.value.path()).read_text();assert not errors,errors
 result={'status':'PASS','checks':['Plus button opens section selector and composer','Saved cards remain beside their target without an open editor','Multiple cards do not overlap','Existing storage format and reload persistence','Edit, delete and undo','Draft recovery','Markdown and JSON export','Mobile cards appear next to the relevant section in normal flow','Safe literal text and storage failure fallback','No JavaScript errors']};(R/'validation/notes-results.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2));b.close()
