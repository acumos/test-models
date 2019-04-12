from nltk.corpus import stopwords 
from nltk.stem.wordnet import WordNetLemmatizer
import string
import gensim
from gensim import corpora
from acumos.session import AcumosSession
from acumos.modeling import Model
def clean(doc):
   
    stop = set(stopwords.words('english'))
    exclude = set(string.punctuation)
    lemma = WordNetLemmatizer()
    stop_free = " ".join([i for i in doc.lower().split() if i not in stop])
    punc_free = ''.join(ch for ch in stop_free if ch not in exclude)
    normalized = " ".join(lemma.lemmatize(word) for word in punc_free.split())
    # print(normalized)
    return normalized


def topic_model(stringFull:str) -> int:
    print("Got: " + stringFull)
    doc_complete = stringFull.splitlines()

    doc_clean = [clean(doc).split() for doc in doc_complete]

    dictionary = corpora.Dictionary(doc_clean)
    doc_term_matrix = [dictionary.doc2bow(doc) for doc in doc_clean]

    Lda = gensim.models.ldamodel.LdaModel
    ldamodel = Lda(doc_term_matrix, num_topics=3, id2word = dictionary, passes=50,random_state = 1)

    #print(str(ldamodel.print_topics(num_words=3)))
    return str(ldamodel.print_topics(num_words=3))

print(topic_model('The best thing about having a sister was that I always had a friend.Eldest sisters are often given great responsibility in family. Your role fosters maturity, leadership, and a sense of empowerment.\n The short and long-term effects of alcohol can affect your body, lifestyle and mental health. \n Sugar increases the risk of obesity, diabetes and heart disease. Large-scale studies have shown that the more high-glycemic foods (those that quickly affect blood sugar), including foods containing sugar, a person consumes, the higher his risk for becoming obese and for developing diabetes and heart disease1.\nFamily is important because it provides love, support and a framework of values to each of its members. ... From their first moments of life, children depend on parents and family to protect them and provide for their needs. Parents and family form a childs first relationships.\n Driving in traffic is more than just knowing how to operate the mechanisms which control the vehicle; it requires knowing how to apply the rules of the road (which ensures safe and efficient sharing with other users). An effective driver also has an intuitive understanding of the basics of vehicle handling and can drive responsibly'))
session = AcumosSession(
        push_api="Http://ACUMOS-SERVER:8090/onboarding-app/v2/models",
        auth_api="http://ACUMOS-SERVER:8090/onboarding-app/v2/auth")
model = Model(topic_model=topic_model)
session.dump(model, 'TechM-TopicModelling', '.') 
