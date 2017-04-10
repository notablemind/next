
get_files:
	# adb shell "cd data/data/org.lds.ldssa; /data/local/tmp/busybox tar czf /data/local/tmp/files.tgz files"
	adb shell "cd data/data/org.lds.ldssa.dev && zip -r /data/local/tmp/files.zip files"
	adb pull data/local/tmp/files.zip
	tar xzf files.zip
	python parse_new.py

