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
from nltk.corpus import stopwords
from textblob.classifiers import NaiveBayesClassifier
from preprocessing import get_tweets


MAX_TWEETS = 1000000000
emoji_stats = {}
usually_together = {}

def count_emojis(emojis):
    for emoji in emojis:
        if emoji in emoji_stats:
            emoji_stats[emoji] += 1
        else:
            emoji_stats[emoji] = 1

def count_together_emojis(emojis):
    emojis_set = set(emojis)
    for emoji in emojis_set:
        if emoji in usually_together:
            for emoji_friend in (emojis_set-{emoji}):
                if emoji_friend in usually_together[emoji]:
                    usually_together[emoji][emoji_friend] += 1
                else:
                    usually_together[emoji][emoji_friend] = 1
        else:
            usually_together[emoji] = {}

for i, single_tweet in enumerate(get_tweets()):
    if i >= MAX_TWEETS:
        break
    print("{}...".format(i))
    tweet, emojis, raw_tweet = single_tweet
    count_emojis(emojis)
    count_together_emojis(emojis)

print("tip, run with -i")
print("`emoji_stats`, `usually_together`")
