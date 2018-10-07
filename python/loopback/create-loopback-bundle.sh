#!/bin/sh
# Creates model and bundles it for web onboarding
dir=bundle-loopback/loopback
rm -fr $dir
echo "$0: Invoking python to create the model"
python loopback.py
echo "$0: Invoking zip to create the bundle"
file=bundle-loopback.zip
zip $file $dir/metadata.json $dir/model.proto $dir/model.zip
echo "$0: Bundle details:"
ls -l $file
