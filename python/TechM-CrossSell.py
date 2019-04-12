# -*- coding: utf-8 -*-
"""
Created on Mon Mar 12 20:01:44 2018

@author: UG00420908
"""

# -*- coding: utf-8 -*-
"""
Created on Mon Mar 12 18:03:50 2018

@author: UG00420908
"""

import pandas as pd
import numpy as np
import statsmodels.api as sm  

from acumos.modeling import Model, List, create_namedtuple, create_dataframe
from acumos.session import AcumosSession

if __name__ == '__main__':
    '''Main'''
    df_scikit=pd.read_excel("./Cross_Sell.xlsx")
    df_scikit =df_scikit.drop(['partyKey'],axis=1)
    
    y = df_scikit['finalexpense']
    X = df_scikit.drop(['finalexpense'],axis=1)
    
    clf= sm.Logit(y,X).fit()
    
    DataFrame = create_dataframe('DataFrame', X)
    Predictions = create_namedtuple('Predictions', [('predictions', List[int])])
    
    def predict(df: DataFrame)-> Predictions:
        X = np.column_stack(df)
        yhat = (clf.predict(X)>.5).astype(int)
        preds = Predictions(predictions=yhat)
        return preds
    
    
    model = Model(classify=predict)

    session = AcumosSession(
        push_api="Http://ACUMOS-SERVER:8090/onboarding-app/v2/models",
        auth_api="http://ACUMOS-SERVER:8090/onboarding-app/v2/auth")

    session.dump(model, 'TechM-CrossSell', '.')  # creates ~/model.zip
    #clear_jwt()
    #session.push(model, 'TechM-CrossSell')
    
    
