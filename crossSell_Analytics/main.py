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
import statsmodels.api as sm

from acumos.modeling import Model, List, create_namedtuple, create_dataframe
from acumos.session import AcumosSession

# Starting Point of Model
if __name__ == '__main__':
    '''Main'''
    df_scikit = pd.read_excel("./Cross_Sell.xlsx")
    df_scikit = df_scikit.drop(['partyKey'], axis=1)

    y = df_scikit['finalexpense']
    X = df_scikit.drop(['finalexpense'], axis=1)

    clf = sm.Logit(y, X).fit()

    DataFrame = create_dataframe('DataFrame', X)
    Predictions = create_namedtuple('Predictions', [('predictions', List[int])])


    def predict(df: DataFrame) -> Predictions:
        X = np.column_stack(df)
        yhat = (clf.predict(X) > .5).astype(int)
        preds = Predictions(predictions=yhat)
        return preds


    model = Model(classify=predict)

    session = AcumosSession()

    session.dump(model, 'CrossSell', '.')  # creates ~/model.zip

