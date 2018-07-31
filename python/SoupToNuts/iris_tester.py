# ===============LICENSE_START=======================================================
# Acumos Apache-2.0
# ===================================================================================
# Copyright (C) 2017-2018 AT&T Intellectual Property & Tech Mahindra. All rights reserved.
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

import iris_model_pb2 as pb
import requests

restURL = "http://localhost:3330/classify"

def classify_iris (sl, sw, pl, pw):
    df = pb.IrisDataFrame()

    df.sepal_length.append(sl)
    df.sepal_width.append(sw)
    df.petal_length.append(pl)
    df.petal_width.append(pw)

    r = requests.post(restURL, df.SerializeToString())

    of = pb.ClassifyOut()
    of.ParseFromString(r.content)

    return of.value[0]

from sklearn.datasets import load_iris
iris = load_iris()
id = iris.data
it = iris.target

for i in range(len(id)):
    print ('Input: {}, Predicted: {}, Actual {}'
           .format(id[i], classify_iris (*(id[i])), it[i]))
