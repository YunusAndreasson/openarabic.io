D="-s emulator-5570"
tbsay(){ adb $D logcat -d | python3 -c "
import sys,re
for l in sys.stdin:
    m=re.search(r'SpeechControllerImpl: Speaking fragment text=\"?(.*?)\"?, utteranceId=\S+, spans=(.*?), event',l)
    if m: print('    SAY',m.group(1)[:230],'| spans:',m.group(2)[:60]); continue
    m=re.search(r'Synthesis request for locale (\S+) and name (\S+)',l)
    if m: print('      tts',m.group(1),m.group(2)); continue
    if re.search(r'Failed|No voice|cannot|LANG_NOT|not supported|isLanguage|Fallback|fallback',l) and re.search(r'TTS|Tts|tts',l): print('      !!',l.strip()[31:170])
    pass
"; }
tbjs(){ adb $D shell true; }
g(){ adb $D logcat -c; echo "> $1"; case $1 in next) adb $D shell input swipe 300 1200 800 1200 120;; prev) adb $D shell input swipe 800 1200 300 1200 120;; click) adb $D shell 'input tap 540 1200 & sleep 0.08; input tap 540 1200';; up) adb $D shell input swipe 500 1500 500 900 120;; down) adb $D shell input swipe 500 900 500 1500 120;; back) adb $D shell input keyevent BACK;; *) adb $D shell input $1;; esac; sleep ${2:-3}; tbsay; }
