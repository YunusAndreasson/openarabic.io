// C: a sentence is one tab stop and reads as one thing. Enter opens the sentence: its words become the tab stops. Escape steps back out.
(function(){
var d=document,r=d.getElementById('reader'),s=d.getElementById('sheet'),P,a,c,S;
if(!CSS.supports('field-sizing:content'))r.querySelectorAll('.w').forEach(function(w){w.textContent=w.textContent});
if(!s||!s.showPopover)return;
function $(i){return d.getElementById(i)}
function W(p,f){p.querySelectorAll('.w').forEach(f)}
function load(){return P=P||fetch(r.dataset.gl).then(function(x){if(!x.ok)throw 0;return x.json()})}
function rest(p){p.tabIndex=0;p.setAttribute('role','button');p.setAttribute('aria-label',p.textContent);W(p,function(w){w.removeAttribute('role');w.removeAttribute('tabindex')})}
r.querySelectorAll('.t').forEach(function(p){rest(p);W(p,function(w){w.dataset.h=w.getAttribute('href');w.removeAttribute('href')})});
$('hint').hidden=false;
function enter(p){if(S!=p){S&&rest(S);S=p;p.removeAttribute('role');p.removeAttribute('aria-label');p.tabIndex=-1;W(p,function(w){w.setAttribute('role','button');w.tabIndex=0})}}
function open(w){
var h=w.dataset.h;enter(w.parentNode);c=w;w.dataset.on=1;
$('se').textContent=$('sn').textContent='';$('sl').href=h;$('sa').hidden=true;
s.showPopover();
load().then(function(g){var x=g[w.dataset.i];$('se').textContent=x[0];$('sn').textContent=x[1]||'';a=x[2];$('sa').hidden=!a;s.focus()},function(){location=h});
}
r.addEventListener('pointerdown',load,{once:true});
s.addEventListener('toggle',function(e){if(e.newState=='closed'&&c){delete c.dataset.on;c.focus({preventScroll:true});c=0}});
s.addEventListener('keydown',function(e){if(e.key=='Tab'&&e.target==(e.shiftKey?s:$('sc'))){e.preventDefault();s.hidePopover()}});
r.addEventListener('focusout',function(e){var t=e.relatedTarget;if(S&&t&&!S.contains(t)&&!s.contains(t)&&!c){rest(S);S=0}});
function into(p){enter(p);p.querySelector('.w').focus()}
r.addEventListener('click',function(e){var t=e.target,w=t.closest('.w');if(String(getSelection()))return;
if(w)open(w);else if(t.getAttribute('role'))into(t)});
r.addEventListener('keydown',function(e){var t=e.target,k=e.key;
if(k==' '||k=='Enter'){if(t.matches('.t'))into(t);else if(t.matches('.w'))open(t);else return}else if(k=='Escape'&&t.matches('.w')){rest(S);S=0;t.parentNode.focus()}else return;e.preventDefault()});
$('sa').addEventListener('click',function(){new Audio('../design-test/material/line-7106-ar.mp3').play()});
})();
