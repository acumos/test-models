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

import logging
import grpc
import model_pb2 as pb
import model_pb2_grpc

logging.basicConfig()
species=['Iris Setosa', 'Iris Versicolour', 'Iris Virginica']
df = pb.IrisDataFrame()
df.sepal_length.append(5.1)
df.sepal_width.append(3.5)
df.petal_length.append(1.4)
df.petal_width.append(0.2)
with grpc.insecure_channel('localhost:8334') as channel:
	stub = model_pb2_grpc.ModelStub(channel)
	classifyout = stub.classify(df)
	print("iris client received species: " + species[classifyout.value[0]])

