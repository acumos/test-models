#!/usr/bin/env python3
# ===================================================================================
# Copyright (C) 2019 Fraunhofer Gesellschaft. All rights reserved.
# ===================================================================================
# This Acumos software file is distributed by Fraunhofer Gesellschaft
# under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# This file is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ===============LICENSE_END=========================================================
import os
import shutil
import subprocess
import json
from zipfile import ZipFile, ZIP_DEFLATED


class ModelPacker(object):

    def __init__(self):
        self.proto_file='microservice/model.proto'
        self.data_dir='data'
        self.lib_dir='lib'
        self.executable='microservice/run-microservice'
        self.model_name='cpp-test-iris'
        if not os.path.isdir('onboarding'):
            os.mkdir('onboarding')

    def create_model_zip(self):
        print('creating model.zip...', end='', flush=True)
        try:
            with ZipFile('onboarding/model.zip', 'w', ZIP_DEFLATED) as zipfile:
                zipfile.write(self.executable, os.path.basename(self.executable))
                self.add_directory(self.lib_dir, 'lib/', zipfile)
                self.add_directory(self.data_dir, 'data/', zipfile)
            print('done.')
        except FileNotFoundError as e:
            print(e)
            quit(1)

    def create_bundle_zip(self):
        bundle_file=self.model_name+'-bundle.zip'
        print('creating '+bundle_file+'...', end='', flush=True)
        try:
            with ZipFile('onboarding/'+bundle_file, 'w', ZIP_DEFLATED) as zipfile:
                zipfile.write('onboarding/model.zip', 'model.zip')
                zipfile.write('onboarding/model.proto', 'model.proto')
                zipfile.write('onboarding/metadata.json', 'metadata.json')
            print('done.')
        except FileNotFoundError as e:
            print(e)
            quit(1)


    def add_directory(self, directory, prefix, zipfile):
        for root, directories, files in os.walk(directory):
            for filename in files:
                filepath = os.path.join(root, filename)
                zipfile.write(filepath, prefix+filename)

    def create_meta(self):
        print('generating metadata')
        shutil.copy(self.proto_file, 'onboarding')
        gcc_version = '7.4.0'
        print('target compiler is gcc '+gcc_version)

        methods = {}
        with open(self.proto_file) as fp:
            for cnt, line in enumerate(fp):
                words = line.strip().split(' ')
                if words[0] == 'rpc':
                    print('adding model method: '+line)
                    param_input = words[2].strip('(').strip(')')
                    param_output = words[4].strip(';').strip('(').strip(')')
                    rpc = {'input': param_input,
                           'output': param_output,
                           'description': ''}
                    methods[words[1]] = rpc

        meta = {'name': self.model_name,
                'schema': 'acumos.schema.model:0.4.0'}

        runtime = {'version': gcc_version,
                   'encoding': 'protobuf',
                   'name': 'c++',
                   'executable': self.executable}

        pip = {'indexes': [], 'requirements': []}
        conda = {'channels': [], 'requirements': []}
        dependencies = {'pip': pip, 'conda': conda}
        runtime['dependencies'] = dependencies

        meta['runtime'] = runtime
        meta['methods'] = methods
        with open('onboarding/metadata.json', 'w') as mfile:
            json.dump(meta, mfile, indent=2)


if __name__ == "__main__":
    subprocess.run(['unxz','lib/libgrpc++.so.1.xz','lib/libgrpc.so.7.xz','lib/libz.so.1.xz','microservice/run-microservice.xz']) 
    packer = ModelPacker()
    packer.create_model_zip()
    packer.create_meta()
    packer.create_bundle_zip()
