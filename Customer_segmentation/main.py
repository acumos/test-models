/*-
 * ===============LICENSE_START=======================================================
 * Acumos
 * ===================================================================================
 * Copyright (C) 2017 AT&T Intellectual Property & Tech Mahindra. All rights reserved.
 * ===================================================================================
 * This Acumos software file is distributed by AT&T and Tech Mahindra
 * under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *  
 *      http://www.apache.org/licenses/LICENSE-2.0
 *  
 * This file is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ===============LICENSE_END=========================================================
 */


import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn import preprocessing

from acumos.modeling import Model, List, create_namedtuple, create_dataframe
from acumos.session import AcumosSession

# # Starting Point of Model
if __name__ == '__main__':
    '''Main'''
    df_scikit = pd.read_csv("./Digital_Data.csv") # Creates DataFrame from Training Data
    df_scikit = df_scikit.drop(['Subscriber'], axis=1)
    df_scikit = df_scikit[['Region', 'TENURE_Days', 'l4_ul_throughput', 'l4_dl_throughput']].fillna(method='ffill')
    scaler = preprocessing.StandardScaler().fit(df_scikit)
    Y = scaler.transform(df_scikit) # 
    X = pd.DataFrame(Y, columns=['Region', 'TENURE_Days', 'l4_ul_throughput', 'l4_dl_throughput'])
    # f = KMeans(n_clusters=4, random_state=10))
    clf = KMeans(n_clusters=4, random_state=10)
    clf.fit(X)

    DataFrame = create_dataframe('DataFrame', X)
    Predictions = create_namedtuple('Predictions', [('predictions', List[int])])


    def predict(df: DataFrame) -> Predictions:
        X = np.column_stack(df)
        yhat = clf.predict(X)
        preds = Predictions(predictions=yhat)
        return preds


    model = Model(classify=predict)

    session = AcumosSession()

    session.dump(model, 'Costmer_segmentation', '.')  # creates ~/model.zip
