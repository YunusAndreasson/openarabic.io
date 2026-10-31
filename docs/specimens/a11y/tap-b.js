// B: one tab stop for the whole text. Arrow keys rove word to word, across sentences. Words stay links.
(function(){
var d=document,r=d.getElementById('reader'),s=d.getElementById('sheet'),P,a,c,W=[].slice.call(r.querySelectorAll('a.w'));
if(!CSS.supports('field-sizing:content'))W.forEach(function(w){w.textContent=w.textContent});
if(!s||!s.showPopover)return;
function $(i){return d.getElementById(i)}
function load(){return P=P||fetch(r.dataset.gl).then(function(x){if(!x.ok)throw 0;return x.json()})}
W.forEach(function(w,i){w.tabIndex=i?-1:0});
r.addEventListener('pointerdown',function(){load();W.forEach(function(w){w.dataset.h=w.getAttribute('href');w.removeAttribute('href')})},{once:true});
function go(w){if(w){W.forEach(function(x){x.tabIndex=-1});w.tabIndex=0;w.focus()}}
function open(w){
var h=w.dataset.h||w.getAttribute('href');c=w;w.dataset.on=1;
$('se').textContent=$('sn').textContent='';$('sl').href=h;$('sa').hidden=true;
s.showPopover();
load().then(function(g){var x=g[w.dataset.i];$('se').textContent=x[0];$('sn').textContent=x[1]||'';a=x[2];$('sa').hidden=!a;s.focus()},function(){location=h});
}
s.addEventListener('toggle',function(e){if(e.newState=='closed'&&c){delete c.dataset.on;c.focus({preventScroll:true})}});
s.addEventListener('keydown',function(e){if(e.key=='Tab'&&e.target==(e.shiftKey?s:$('sc'))){e.preventDefault();s.hidePopover()}});
r.addEventListener('click',function(e){var w=e.target.closest('a.w');if(w){e.preventDefault();if(!String(getSelection()))open(w)}});
r.addEventListener('keydown',function(e){var w=e.target.closest('a.w'),k=e.key,i=W.indexOf(w);if(!w)return;
if(k=='ArrowLeft')go(W[i+1]);else if(k=='ArrowRight')go(W[i-1]);else if(k=='ArrowDown')go((w.parentNode.nextElementSibling.nextElementSibling||0).firstChild);else if(k=='ArrowUp')go((w.parentNode.previousElementSibling&&w.parentNode.previousElementSibling.previousElementSibling||0).firstChild);else if(k==' ')open(w);else return;e.preventDefault()});
$('sa').addEventListener('click',function(){new Audio('../design-test/material/line-7106-ar.mp3').play()});
})();
