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