
get_files:
	adb shell "cd data/data/org.lds.ldssa; zip -r files.zip files"
	adb pull data/data/org.lds.ldssa/files.zip
	unzip files.zip
	python parse_new.py

