#!/bin/bash
# Runs inside dbus-run-session: private X, private session bus, private a11y bus, private HOME. Nothing reaches the owner's desktop.
S=/tmp/claude-1000/-home-yunus-Work-openarabic-web/86f2c8eb-ffa7-4502-bdbd-379319382ec1/scratchpad; R=/tmp/claude-1000/-home-yunus-Work-openarabic-web/86f2c8eb-ffa7-4502-bdbd-379319382ec1/scratchpad/orca/root; D=${D:-:88}
export PYTHONPATH=$R/usr/lib/python3.14/site-packages LD_LIBRARY_PATH=$R/usr/lib ESPEAK_DATA_PATH=$R/usr/share/espeak-ng-data
export SPEECHD_ADDRESS=unix_socket:$S/orcahome/run/speechd.sock
gdbus call --session --dest org.a11y.Bus --object-path /org/a11y/bus --method org.freedesktop.DBus.Properties.Set org.a11y.Status IsEnabled '<true>' 
env | grep -E '^(DBUS_SESSION_BUS_ADDRESS|DISPLAY|HOME|XDG_|GSETTINGS|PYTHONPATH|LD_LIBRARY_PATH|ESPEAK|SPEECHD|GDK_)' | sed 's/^/export /' > $S/session.env
touch $S/session.ready
exec sleep 7200
