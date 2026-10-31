// A: every word stays a link and a tab stop. Skip link only. href kept until first pointer contact (plan 2.4).
(function(){
var d=document,r=d.getElementById('reader'),s=d.getElementById('sheet'),P,a,c;
if(!CSS.supports('field-sizing:content'))r.querySelectorAll('.w').forEach(function(w){w.textContent=w.textContent});
if(!s||!s.showPopover)return;
function $(i){return d.getElementById(i)}
function load(){return P=P||fetch(r.dataset.gl).then(function(x){if(!x.ok)throw 0;return x.json()})}
r.addEventListener('pointerdown',function(){load();r.querySelectorAll('a.w').forEach(function(w){w.dataset.h=w.getAttribute('href');w.removeAttribute('href')})},{once:true});
function open(w){
var h=w.dataset.h||w.getAttribute('href');c=w;w.dataset.on=1;
$('se').textContent=$('sn').textContent='';$('sl').href=h;$('sa').hidden=true;
s.showPopover();
load().then(function(g){var x=g[w.dataset.i];$('se').textContent=x[0];$('sn').textContent=x[1]||'';a=x[2];$('sa').hidden=!a;s.focus()},function(){location=h});
}
s.addEventListener('toggle',function(e){if(e.newState=='closed'&&c){delete c.dataset.on;c.focus({preventScroll:true})}});
s.addEventListener('keydown',function(e){if(e.key=='Tab'&&e.target==(e.shiftKey?s:$('sc'))){e.preventDefault();s.hidePopover()}});
r.addEventListener('click',function(e){var w=e.target.closest('a.w');if(w){e.preventDefault();if(!String(getSelection()))open(w)}});
$('sa').addEventListener('click',function(){new Audio('../design-test/material/line-7106-ar.mp3').play()});
})();
