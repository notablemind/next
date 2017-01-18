# How to get the files

```
adb shell
cd data/data/org.lds.ldssa
zip -r files.zip files
# exit shell
adb pull data/data/org.lds.ldssa/files.zip
unzip files.zip
python parse_new.py
```
