
# coding: utf-8

# In[1]:

from __future__ import division
import h2o, os
from h2o.estimators.glm import H2OGeneralizedLinearEstimator


# In[2]:

h2o.init()


# In[3]:

print('Importing domains data...')
path = os.path.join(os.path.realpath(os.getcwd()), 'legit-dga_domains.csv')
domains = h2o.import_file(path, header=1)
print (domains)


# In[4]:

print('Data cleaning...')
domains = domains[~domains['subclass'].isna()]
print(domains)


# In[5]:

print('Feature: string length')
domains['length'] = domains['domain'].nchar()
print(domains)


# In[6]:

print('Feature: Shannon entropy')
domains['entropy'] = domains['domain'].entropy()
print(domains)


# In[7]:

print('Feature: proportion of vowels')
domains['p_vowels'] = 0
for v in 'aeiou':
  domains['p_vowels'] += domains['domain'].countmatches(v)

domains['p_vowels'] /= domains['length']
print(domains)


# In[8]:

print('Feature: count of substrings that are English words')
english_words = os.path.join(os.path.realpath(os.getcwd()),'words.txt')
domains['num_words'] = domains['domain'].num_valid_substrings(english_words)
print(domains)


# In[9]:

print('\nResponse: Is domain malicious?')
domains['malicious'] = domains['class'] != 'legit'


# In[10]:

rand = domains.runif(seed=123456)
train = domains[rand <= 0.8]
valid = domains[rand > 0.8]


# In[11]:

print('\nModel: Logistic regression with regularization')
model = H2OGeneralizedLinearEstimator(model_id='MaliciousDomainModel',
                                      family='binomial', alpha=0, Lambda=1e-5)


# In[12]:

model.train(x=['length', 'entropy', 'p_vowels', 'num_words'],
            y='malicious', training_frame=train, validation_frame=valid)


# In[13]:

print(model.confusion_matrix(valid=True))


# In[ ]:




# In[14]:

# Download the model in MOJO format. Also download the h2o-genmodel.jar file
modelfile = model.download_mojo(path="/home/deven/Desktop/", get_genmodel_jar=True)


