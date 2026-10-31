import sys,re
# prints every utterance sent to speech-dispatcher since line N, with the language Orca set for it.
L=open(sys.argv[1],errors='replace').read().split('\n')[int(sys.argv[2]):]
out=[]
for i,l in enumerate(L):
    m=re.search(r"SPEECH DISPATCHER: Speaking '(<speak>.*)' *$",l)
    if not m: continue
    t=re.sub(r'<[^>]+>','',m.group(1)); 
    lang=''
    for j in range(i+1,min(i+4,len(L))):
        g=re.search(r'ORCA rate.*language ([\w-]+)',L[j])
        if g: lang=g.group(1); break
    if t.strip() in('tab','left control','Control_L'): continue
    out.append((t,lang))
for t,lang in out: print('    ',t[:int(sys.argv[3]) if len(sys.argv)>3 else 200],'['+lang+']')
