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



#!/usr/bin/python



from nltk.tokenize import RegexpTokenizer
from sklearn.ensemble import RandomForestClassifier
import matplotlib.pyplot as plt
from nltk.stem.snowball import SnowballStemmer
import gensim
from gensim import models, corpora
from nltk.corpus import stopwords
import nltk.classify.util
from nltk.classify import NaiveBayesClassifier
from nltk.corpus import movie_reviews
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.svm import LinearSVC
from cognita_client.push import push_sklearn_model




striptext = text.replace('\n\n', ' ')
striptext = striptext.replace('\n', ' ')



#Summarizing the stuff
summary = gensim.summarization.summarize(striptext, word_count=50)
keywords = gensim.summarization.keywords(striptext)
print(keywords)
print(summary)

# Load input data
def load_data(input_file):
    data = []
    with open(input_file, 'r',encoding="utf8") as f:
        for line in f.readlines():
            data.append(line[:-1])

    return data


def plot_coefficients(classifier, feature_names, top_features=20):
 coef = classifier.coef_.ravel()
 top_positive_coefficients = np.argsort(coef)[-top_features:]
 top_negative_coefficients = np.argsort(coef)[:top_features]
 top_coefficients = np.hstack([top_negative_coefficients, top_positive_coefficients])
 print(len(top_coefficients))
 print(top_positive_coefficients)
 print(top_negative_coefficients)
 # create plot
 plt.figure(figsize=(15, 5))
 colors = ['red' if c < 0 else 'blue' for c in coef[top_coefficients]]
 plt.bar(np.arange(2 * top_features), coef[top_coefficients], color=colors)
 feature_names = np.array(feature_names)
 #plt.xticks(np.arange(1, 1 + 2 * top_features), feature_names[top_coefficients], rotation=60, ha='right')
 plt.show()


def extract_features(word_list):
    return dict([(word, True) for word in word_list])
# Class to preprocess text
class Preprocessor(object):
    # Initialize various operators
    def __init__(self):
        # Create a regular expression tokenizer
        self.tokenizer = RegexpTokenizer(r'\w+')

        # get the list of stop words
        self.stop_words_english = stopwords.words('english')

        # Create a Snowball stemmer
        self.stemmer = SnowballStemmer('english')

    # Tokenizing, stop word removal, and stemming
    def process(self, input_text):
        # Tokenize the string
        tokens = self.tokenizer.tokenize(input_text.lower())

        # Remove the stop words
        tokens_stopwords = [x for x in tokens if not x in self.stop_words_english]

        # Perform stemming on the tokens
        #tokens_stemmed = [self.stemmer.stem(x) for x in tokens_stopwords]

        return tokens_stopwords
    
    
    
import pandas as pd
import numpy as np

columns = ['1','2','3','4','5','6']

df = pd.DataFrame(columns = columns)
pd.set_option('display.width', 1000)

# 40 will be resized later to match number of words in DC
zz = np.zeros(shape=(40,6))

last_number=0
DC={}

for x in range (10):
  data = pd.DataFrame({columns[0]:"",
                     columns[1]:"",
                     columns[2]:"",
                     columns[3]:"",
                     columns[4]:"",
                     columns[5]:"",

                                                                                       
                     
                    },index=[0])
  df=df.append(data,ignore_index=True)  
  
  
  


if __name__=='__main__':
    # File containing linewise input data
 #   input_file = 'data_topic_modeling.txt'

    # Load data
#    data = load_data(input_file)

    # Create a preprocessor object
    preprocessor = Preprocessor()

    # Create a list for processed documents
    processed_tokens = [preprocessor.process(x) for x in data]
    processed_tokens = [preprocessor.process(striptext)]
    
    # Create a dictionary based on the tokenized documents
    dict_tokens = corpora.Dictionary(processed_tokens)

    # Create a document-term matrix
    corpus = [dict_tokens.doc2bow(text) for text in processed_tokens]
    #corpus = [dict_tokens.doc2bow(processed_tokens)]

    # Generate the LDA model based on the corpus we just created
    tfidf = models.TfidfModel(corpus)
    corpus_tfidf = tfidf[corpus]
    num_topics = 6
    num_words = 5
    ldamodel = models.LdaModel(corpus,
            num_topics=num_topics, id2word=dict_tokens, passes=25)
    ldamodel1 = models.HdpModel(corpus,
            id2word=dict_tokens)       

    print('\nMost contributing words to the topics:')
    for item in ldamodel1.print_topics():
         print(item)

    for item in ldamodel.print_topics(num_topics=num_topics, num_words=num_words):
         print('\nTopic', item[0], '==>', item[1])
         
         
    for line in ldamodel.print_topics(num_topics=num_topics, num_words=num_words):
    
        tp, w = line
        probs=w.split("+")
        y=0
        for pr in probs:
               
            a=pr.split("*")
            df.iloc[y,tp] = a[1]
           
            if a[1] in DC:
               zz[DC[a[1]]][tp]=a[0]
            else:
               zz[last_number][tp]=a[0]
               DC[a[1]]=last_number
               last_number=last_number+1
            y=y+1

    print (df)
    print (zz)
    zz=np.resize(zz,(len(DC.keys()),zz.shape[1]))
    for val, key in enumerate(DC.keys()):
        plt.text(-2.5, val + 0.5, key,
                 horizontalalignment='center',
                 verticalalignment='center'
                 )
    plt.imshow(zz, cmap='hot', interpolation='nearest')
    plt.show()
            
    
    positive_fileids = movie_reviews.fileids('pos')
    negative_fileids = movie_reviews.fileids('neg')

    features_positive = [(extract_features(movie_reviews.words(fileids=[f])),
            'Positive') for f in positive_fileids]
    features_negative = [(extract_features(movie_reviews.words(fileids=[f])),
            'Negative') for f in negative_fileids]

    # (80/20) rule was used on a completely different corpus(Moview review database)
    threshold_factor = 0.8
    threshold_positive = int(threshold_factor * len(features_positive))
    threshold_negative = int(threshold_factor * len(features_negative))

    features_train = features_positive[:threshold_positive] + features_negative[:threshold_negative]
    features_test = features_positive[threshold_positive:] + features_negative[threshold_negative:]
    print('\nNumber of training datapoints:', len(features_train))
    print('Number of test datapoints:', len(features_test))
    
    #Training technique number 2
    def word_feats(words):
        return dict([(word, True) for word in words])
 
    positive_vocab = [ 'awesome', 'outstanding', 'fantastic', 'terrific', 'good', 'nice', 'great', ':)', 'up' ]
    negative_vocab = [ 'bad', 'terrible','useless', 'hate', ':(', 'down' ]
    neutral_vocab = [ 'movie','the','sound','was','is','actors','did','know','words','not' ]
 
    positive_features = [(word_feats(pos), 'pos') for pos in positive_vocab]
    negative_features = [(word_feats(neg), 'neg') for neg in negative_vocab]
    neutral_features = [(word_feats(neu), 'neu') for neu in neutral_vocab]
    train_set = negative_features + positive_features + neutral_features
    
    # Naive Bayes classifier is used but we have plenty of other  options as well
    #classifier = NaiveBayesClassifier.train(features_train)
    classifier = NaiveBayesClassifier.train(train_set)
    print('\nAccuracy of the classifier:', nltk.classify.util.accuracy(classifier, features_test))

    print('\nTop 10 most informative words:')
    for item in classifier.most_informative_features()[:10]:
        print(item[0])

    input_reviews = nltk.sent_tokenize(striptext)
    cv = CountVectorizer()
    cv.fit(input_reviews)
    print (len(cv.vocabulary_))
    print (cv.get_feature_names())
    X_train = cv.transform(input_reviews)

    svm = LinearSVC()
    model = RandomForestClassifier(random_state=0)
    svm.fit(X_train,input_reviews )
    plot_coefficients(svm, cv.get_feature_names())
    print('\nPredictions:')
    List_of_positives = []
    List_of_negatives = []
    neg = 0
    pos = 0
    sentence = "Awesome movie, I liked it"
    for review in input_reviews:
        sentence = review.lower()
        words = sentence.split(' ')
        for word in words:
            classResult = classifier.classify( word_feats(word))
            if classResult == 'neg':
                neg = neg - 1
            if classResult == 'pos':
                pos = pos + 1
 
    print('Overall_Positive: ' + str(float(pos)/len(words)))
    print('Overall_Negative: ' + str(float(neg)/len(words)))
    print('Overall_sentiment: '+str((float(pos)/len(words) + float(neg)/len(words))/len(input_reviews) ))
    for review in input_reviews:
        print('\nReview:', review)
        probdist = classifier.prob_classify(extract_features(review.split()))
        pred_sentiment = probdist.max()
        print('Predicted sentiment:', pred_sentiment)
        if pred_sentiment == 'pos':
            List_of_positives.append('pos')
        else:
            List_of_negatives.append('neg')
        print('Probability:', round(probdist.prob(pred_sentiment), 2))

    push_sklearn_model(model, corpus, name='sklearn_sentiment_techM' , api='http://cognita-ist2-vm01-core.eastus.cloudapp.azure.com:8090/onboarding-app/v2/models')

