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
from acumos.auth import clear_jwt,_configuration

clear_jwt();
token = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ2azA5MDAiLCJyb2xlIjpbeyJwZXJtaXNzaW9uTGlzdCI6bnVsbCwicm9sZUNvdW50IjowLCJyb2xlSWQiOiI5ZDk2MTAxOC01NDY0LTViMGUtYTljMi0xMWRjZGZkYjY3YTAiLCJuYW1lIjoiUHVibGlzaGVyIiwiYWN0aXZlIjp0cnVlLCJjcmVhdGVkIjoxNTM3ODkwMjEzMDAwLCJtb2RpZmllZCI6bnVsbH1dLCJjcmVhdGVkIjoxNTQ1MzM3OTA5NzQxLCJleHAiOjE1NDU0MTc5MDksIm1scHVzZXIiOnsiY3JlYXRlZCI6MTUzMTE3MTIyMjAwMCwibW9kaWZpZWQiOjE1NDUzMzc5MDkwMDAsInVzZXJJZCI6IjZkZGQzODlmLTdkNGMtNDgyMy05YTlmLWQyMzkzOWEyYzk1NSIsImZpcnN0TmFtZSI6IlZBU1VERVZBIFJBTyIsIm1pZGRsZU5hbWUiOm51bGwsImxhc3ROYW1lIjoiS0FMTEVQQUxMSSIsIm9yZ05hbWUiOm51bGwsImVtYWlsIjoidmswOTAwQHVzLmF0dC5jb20iLCJsb2dpbk5hbWUiOiJ2azA5MDAiLCJsb2dpbkhhc2giOm51bGwsImxvZ2luUGFzc0V4cGlyZSI6bnVsbCwiYXV0aFRva2VuIjpudWxsLCJhY3RpdmUiOmZhbHNlLCJsYXN0TG9naW4iOjE1NDUzMzU3MjkwMDAsImxvZ2luRmFpbENvdW50IjpudWxsLCJsb2dpbkZhaWxEYXRlIjpudWxsLCJwaWN0dXJlIjpudWxsLCJhcGlUb2tlbiI6IjAwYmU2YzA1NTNmZTRhYmNiNjkwZWFhM2VjMzViMGM0IiwidmVyaWZ5VG9rZW5IYXNoIjpudWxsLCJ2ZXJpZnlFeHBpcmF0aW9uIjpudWxsLCJ0YWdzIjpbXX19.6Bkb4PRK6n-tO6rzZBs9RZ7UdbasiZ51XwUkjYX6_eBiAji6LfKyuDGf5uBdCy1UpvWB0P6Gskov6LCzgwpY5g'
_configuration(jwt=token)


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
        push_api="Http://acumosr-dev.research.att.com:8090/onboarding-app/v2/models",
        auth_api="http://acumosr-dev.research.att.com:8090/onboarding-app/v2/auth")

    session.dump(model, 'CrossSell_CLI_12202018', '.')  # creates ~/model.zip
    #clear_jwt()
    session.push(model, 'CrossSell_CLI_12202018')
    
    
