S=/tmp/claude-1000/-home-yunus-Work-openarabic-web/86f2c8eb-ffa7-4502-bdbd-379319382ec1/scratchpad
export DISPLAY=:88; LOG=${LOG:-$S/logs/orca-cr.log}; PORT=${PORT:-9355}
mark(){ MARK=$(wc -l < "$LOG"); }
k(){ mark; echo "> $1 ${3:-}"; xdotool key $1; sleep ${2:-2}; said; }
ae(){ node $S/cdp.mjs $PORT "(function(){var e=document.activeElement;return (e.id||e.tagName)+' | '+(e.textContent||'').trim().slice(0,30)+' | popover='+!!document.querySelector('#sheet:popover-open')+' | y='+Math.round(scrollY)})()"; }
oc(){ gdbus call --session --dest org.gnome.Orca1.Service --object-path /org/gnome/Orca1/Service/$1 --method org.gnome.Orca1.Module.ExecuteCommand "$2" "${3:-false}" 2>&1 | cut -c1-200; }
sayall(){ mark; echo "> SayAll ($1 s)"; gdbus call --session --dest org.gnome.Orca1.Service --object-path /org/gnome/Orca1/Service/SayAllPresenter --method org.gnome.Orca1.SayAllPresenter.SayAll false >/dev/null; sleep ${1:-10}; said; xdotool key Control_L; sleep 1; }
said(){ python3 $S/said.py "$LOG" "${MARK:-0}" ${1:-200}; }
nav(){ node $S/cdp.mjs $PORT "location.href='about:blank';1" >/dev/null; sleep 1; node $S/cdp.mjs $PORT "location.href='$1?'+Date.now();1" >/dev/null; sleep 5; xdotool windowfocus --sync $(xdotool search --onlyvisible --name "${2:-Reader}" | head -1); sleep ${3:-10}; }
fresh(){ pkill -x orca; : > $S/logs/o.log; LOG=$S/logs/o.log;  sleep 1; node $S/cdp.mjs $PORT "location.href='about:blank';1" >/dev/null; sleep 1; node $S/cdp.mjs $PORT "location.href='http://127.0.0.1:4390/a11y/$1?'+Date.now();1" >/dev/null; sleep 3; nohup setsid $S/orca-start.sh $LOG > /dev/null 2>&1 & 
sleep 1; xdotool windowfocus --sync $(xdotool search --onlyvisible --name "${2:-Reader}" | head -1); sleep 12; mark; }
zae(){ curl -s -m 8 --get --data-urlencode "e=(function(){var e=document.activeElement;return (e.id||e.tagName)+' | '+(e.textContent||'').trim().slice(0,30)+' | popover='+!!document.querySelector('#sheet:popover-open')+' | y='+Math.round(scrollY)})()" http://127.0.0.1:9445/eval; echo; }
zfresh(){ pkill -x orca; : > $S/logs/oz.log; LOG=$S/logs/oz.log; sleep 1; curl -s -m 15 --get --data-urlencode "u=http://127.0.0.1:4390/a11y/$1?$(date +%s)" http://127.0.0.1:9445/goto >/dev/null; sleep 2; nohup setsid $S/orca-start.sh $LOG > /dev/null 2>&1 &
 sleep 1; xdotool windowactivate --sync $(xdotool search --onlyvisible --name 'Zen|Reader|Story' | tail -1); sleep 12; mark; }
