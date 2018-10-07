# ===============LICENSE_START=======================================================
# Acumos Apache-2.0
# ===================================================================================
# Copyright (C) 2018 AT&T Intellectual Property & Tech Mahindra. All rights reserved.
# ===================================================================================
# This Acumos software file is distributed by AT&T and Tech Mahindra
# under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# This file is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ===============LICENSE_END=========================================================

# creates an Acumos model aka solution with a loopback function
# and serializes the result to a subdirectory.

from acumos.modeling import Model, NamedTuple
from acumos.session import AcumosSession
import acumos
import sys

class SimpleMessage(NamedTuple):
    '''Type carrying a single string'''
    s: str

def echo(s: SimpleMessage) -> SimpleMessage:
    '''Answers its argument.'''
    return s

print('Acumos version is {}'.format(acumos.__version__))
model = Model(loopback=echo)

# Test the model function
val='hi'
out = model.loopback.inner(val)
if out is None or out != val:
    print('Failed to get expected output, giving up.')
    sys.exit()
else:
    print('model function says {}'.format(out))

# Serialize the model to support web on-boarding
session = AcumosSession()
subdir='bundle-loopback'
print('dumping model to subdir {}'.format(subdir))
session.dump(model, 'loopback', subdir)

# Must create a valid session to on-board this to an acumos instance.
# Alternately can use direct on-boarding
#host='acumos-host-name.org'
#print('creating session using host {}'.format(host))
#session=AcumosSession(
#  push_api='http://{}/upload'.format(host),
#  auth_api='http://{}/auth'.format(host))
#print('on-boarding model to host {}'.format(host))
#session.push(model, 'hello-world')
