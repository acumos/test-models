# -*- coding: utf-8 -*-
"""
Created on Wed Mar 14 13:28:44 2018

@author: UG00420908
"""

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn import preprocessing


from acumos.modeling import Model, List, create_namedtuple, create_dataframe
from acumos.session import AcumosSession

if __name__ == '__main__':
    '''Main'''
    df_scikit=pd.read_csv("./Digital_Data.csv")  
    df_scikit =df_scikit.drop(['Subscriber'],axis=1)    
    df_scikit=df_scikit[['Region','TENURE_Days','l4_ul_throughput','l4_dl_throughput']].fillna(method='ffill')
    scaler = preprocessing.StandardScaler().fit(df_scikit)
    Y=scaler.transform(df_scikit)
    X=pd.DataFrame(Y,columns=['Region','TENURE_Days','l4_ul_throughput','l4_dl_throughput'])
   #f = KMeans(n_clusters=4, random_state=10))
    clf = KMeans(n_clusters=4, random_state=10)
    clf.fit(X)
    
    DataFrame = create_dataframe('DataFrame', X)
    Predictions = create_namedtuple('Predictions', [('predictions', List[int])])
    
    def predict(df: DataFrame)-> Predictions:
        X = np.column_stack(df)
        yhat = clf.predict(X)
        preds = Predictions(predictions=yhat)
        return preds
    
    
    model = Model(classify=predict)
    #print(model)

    session = AcumosSession(
          push_api="http://ACUMOS-SERVER:8090/onboarding-app/v2/models",
          auth_api="http://ACUMOS-SERVER:8090/onboarding-app/v2/auth")
    session.dump(model, 'TechM-CustomerSegmentation', '.')  # creates ~/model.zip
    # clear_jwt()
#    session.push(model, 'TechM-CustomerSegmentation')

    
