# Real kernel touch events on the virtio touchscreen: these go through Android's TouchExplorer, unlike `input`, which bypassed it here.
adb_touch(){ # builds a device-side script
python3 - "$@" <<'PY'
import sys
op=sys.argv[1]
E='/dev/input/event2'
def ev(t,c,v): return f'sendevent {E} {t} {c} {v}'
S=0x35;Y=0x36;T=0x39;SY=lambda: 'sendevent %s 0 0 0'%E
sx=lambda x:int(x*32767/1080); sy=lambda y:int(y*32767/2400)
out=[]
def down(x,y,i): out.extend([ev(3,0x2f,0),ev(3,T,i),ev(3,0x30,20),ev(3,0x3a,512),ev(3,S,sx(x)),ev(3,Y,sy(y)),SY()])
def move(x,y): out.extend([ev(3,S,sx(x)),ev(3,Y,sy(y)),SY()])
def up(): out.extend([ev(3,0x3a,0),ev(3,T,4294967295),SY()])
if op=='swipe':
    x1,y1,x2,y2=map(int,sys.argv[2:6]); n=8
    down(x1,y1,501)
    for i in range(1,n+1): move(x1+(x2-x1)*i//n,y1+(y2-y1)*i//n)
    up()
elif op=='tap':
    x,y=map(int,sys.argv[2:4]); down(x,y,502); up()
elif op=='dtap':
    x,y=map(int,sys.argv[2:4]); down(x,y,503); up(); out.append('sleep 0.08'); down(x,y,504); up()
print('\n'.join(out))
PY
}
g(){ adb $D logcat -c; echo "> $1 $2"; case $1 in next) adb_touch swipe 200 1300 900 1300 | adb $D shell sh;; prev) adb_touch swipe 900 1300 200 1300 | adb $D shell sh;; click) adb_touch dtap 540 1300 | adb $D shell sh;; tap) adb_touch tap $2 | adb $D shell sh;; back) adb $D shell input keyevent BACK;; esac; sleep ${3:-3}; tbsay; }
g(){ adb $D logcat -c; echo "> $1 $2"; case $1 in next) adb_touch swipe 200 1300 900 1300 | adb $D shell sh;; prev) adb_touch swipe 900 1300 200 1300 | adb $D shell sh;; click) adb $D shell 'cd /data/local/tmp; E=/dev/input/event2; cat d1.bin >$E; sleep 0.04; cat up.bin >$E; sleep 0.08; cat d2.bin >$E; sleep 0.04; cat up.bin >$E';; tap) adb_touch tap $2 | adb $D shell sh;; back) adb $D shell input keyevent BACK;; esac; sleep ${3:-3}; tbsay; }
shot(){ adb $D exec-out screencap -p > $S/$1.png; }
aa(){ node $S/cdpa.mjs 9366 "(function(){var e=document.activeElement;return (e.id||e.tagName)+' | '+(e.getAttribute('role')||'')+' | '+(e.textContent||'').trim().slice(0,28)+' | sheet='+!!document.querySelector('#sheet:popover-open')+' | active-sentence-words='+document.querySelectorAll('.w[role=button]').length+' | y='+Math.round(scrollY)})()"; }
g(){ adb $D logcat -c; echo "> $1 $2"; case $1 in next) adb_touch swipe 200 1300 900 1300 | adb $D shell sh;; prev) adb_touch swipe 900 1300 200 1300 | adb $D shell sh;; click) adb $D shell sh /data/local/tmp/dtap.sh;; tap) adb_touch tap $2 | adb $D shell sh;; back) adb $D shell input keyevent BACK;; esac; sleep ${3:-3}; tbsay; }
click(){ for i in 1 2 3 4 5 6; do adb $D logcat -c; adb $D shell sh /data/local/tmp/dtap.sh; sleep 2; if adb $D logcat -d | grep -q 'GESTURE_DOUBLE_TAP detected'; then echo "> double-tap (attempt $i)"; sleep ${1:-2}; tbsay; return; fi; sleep 1; done; echo "> double-tap NOT RECOGNISED"; }
navt(){ node $S/cdpa.mjs 9366 "history.scrollRestoration='manual';location.href='http://10.0.2.2:4390/a11y/$1?'+Date.now();1" >/dev/null; sleep 5; }
g(){ local tries=0; for tries in 1 2 3 4; do adb $D logcat -c; adb $D shell sh /data/local/tmp/$1.sh; sleep 1.5; if adb $D logcat -d | grep -qE 'GESTURE_SWIPE_(LEFT|RIGHT) detected'; then echo "> swipe $1 ($tries)"; sleep ${2:-1.5}; tbsay; return; fi; sleep 1; done; echo "> $1: swipe NOT RECOGNISED"; tbsay; }
top(){ adb $D logcat -c; adb_touch tap 400 295 | adb $D shell sh; sleep 2.5; echo "> explore heading"; tbsay; }
