/*
# ===============LICENSE_START=======================================================
# Acumos Apache-2.0
# ===================================================================================
# Copyright (C) 2017-2019 AT&T Intellectual Property & Tech Mahindra. All rights reserved.
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
# ===============LICENSE_END=========================================================# 
*/

/**
 pad.parser.js - method for parsing different result structures
*/

function ParserControl($scope, options)
{
    /////////////////////////////////////////////////////
    // private data
    var cache_private = {};

    $scope.parsers = {};
    
    /////////////////////////////////////////////////////
    // exposed functions

    $scope.fn.parse_clear_cache = function() {
        cache_private = {};
    }

    $scope.parsers.RegionDetection = function(data, result, model_name) {
        var field_prefer = ["region", "x", "y", "w", "h"];
        result.data = [];
        var boxes = [];

        $.each(data, function(i,sample) {
            if ('region' in sample && sample.region==-1) return true;         //skip this region
            if (i > $scope.config_user["Result Limit"]) return false;           //stop parsing
            var sample_expose = {};
            $.each(field_prefer, function(i,k) {      // only scan fields
                if (k in sample) {
                    //instead of type checking, just select the fields we want!
                    // var type_v = typeof(v);
                    // if (type_v=='function' || type_v=='object') return true;
                    // if (k!='imageBinary' && k!='mimeType' && k!='image')
                    sample_expose[k] = sample[k];
                }
            });
            if (sample.x && sample.y) {  //valid bounding box examples?
                boxes.push({'x':sample.x, 'y':sample.y, 'w':sample.w, 'h':sample.h, 'i':i});
                sample_expose['_color'] = i;
            }
            result.data.push(sample_expose);
        });

        if (boxes.length && 'sample' in result) {
            result.color = 'region';
            $scope.fn.sample_draw(result.sample, model_name, function() {
                $.each(boxes, function(i,v) {
                    $scope.fn.canvas_rect(model_name, false, v.x, v.y, v.w, v.h, v.i);
                });
            });
        }
        if (result.data.length==0) {
            result.data.push({"status":"No regions found."});
        }

        result.key = 'region';
        return true;
    }

    $scope.parsers.ImageTag = function(data, result) {
        result.data = [];

        // sort by value
        data.sort(function (a, b) {
            return b.score - a.score;           //reverse sort
        });

        $.each(data, function(i,sample) {
            if (i > $scope.config_user["Result Limit"]) return false;           //stop parsing
            var sample_expose = {};
            var skip_sample = false;
            $.each(sample, function(k,v) {      // only scan fields
                var type_v = typeof(v);
                if (type_v=='function' || type_v=='object') return true;
                if (k=='score') {
                    sample_expose[k] = score_round(v);
                    skip_sample = (sample_expose[k] == 0);
                }
                else if (k!='image') {
                    sample_expose[k] = v;
                }
            });
            if (!skip_sample) {
                result.data.push(sample_expose);
            }
        });
        result.key = 'score';

        return true;
    }

    $scope.parsers.Image = function(data, result) {
        var valid_image = false;
        $.each(data, function(i,sample) {
            // at this time, we only support ONE output image, so we will loop through
            //  to grab the largest image (old code could grab the one with region == -1)
            //some images are too big for direct btoa/array processing...
            if ('imageBinary' in sample && 'mimeType' in sample) {
                result.data = {'src':BlobToDataURI(sample.imageBinary, sample.mimeType)};
                valid_image = true;
            }
            return false;       //only process the first image/sample
        });

        // TODO: markup the canvas image for this item?
        return valid_image;
    }

    $scope.parsers.FoundObject = function(data, result, model_name) {
        var field_prefer = ["tag", "score", "width", "height"];
        var boxes = [];
        result.data = [];
        $.each(data, function(i,sample) {
            if (i > $scope.config_user["Result Limit"]) return false;           //stop parsing
            var sample_expose = {};
            $.each(field_prefer, function(i,k) {      // only scan fields
                if (k in sample) {
                    var type_v = typeof(sample[k]);
                    if (type_v=='function' || type_v=='object') 
                        return true;
                    if (k=='score') 
                        sample_expose[k] = score_round(sample[k]);
                    else 
                        sample_expose[k] = sample[k];
                }
            });
            if (sample.left && sample.top) {  //valid bounding box examples?
                boxes.push({'x':sample.left, 'y':sample.top, 'w':sample.width, 'h':sample.height, 'i':i});
                sample_expose['_color'] = i;
            }
            result.data.push(sample_expose);
        });
        result.key = 'score';

        if (boxes.length && 'sample' in result) {
            result.color = 'tag';  // add color box next to tag
            $scope.fn.sample_draw(result.sample, model_name, function() {
                $.each(boxes, function(i,v) {
                    $scope.fn.canvas_rect(model_name, false, v.x, v.y, v.w, v.h, v.i);
                });
            });
        }

        if (result.data.length==0) {
            result.data.push({"status":"No objects found."});
        }
        return true;
    }        

    $scope.parsers.RegionTag = function(data, result) {
        var region_seen = {};
        var field_prefer = ["region", "tag", "score"];
        result.data = [];

        // sort by value
        data.sort(function (a, b) {
            return b.score - a.score;           //reverse sort
        });

        $.each(data, function(i,sample) {
            if (!(sample['region'] in region_seen))
                region_seen[sample['region']] = 0;
            if (i > $scope.config_user["Result Limit"] || region_seen[sample['region']]>=3) return false;           //stop parsing
            var sample_expose = {};
            var skip_sample = false;
            $.each(field_prefer, function(i,k) {      // only scan fields
                if (k in sample) {
                    if (k=='score') {
                        sample_expose[k] = score_round(sample[k]);
                        skip_sample = (sample_expose[k] == 0);
                    }
                    else if (k!='image') {
                        sample_expose[k] = sample[k];
                    }
                }
            });
            if (!skip_sample) {
                sample_expose['tag'] = sample_expose['tag'].replace(/_/gi, ' ');
                region_seen[sample_expose['region']] = ++region_seen[sample_expose['region']];
                result.data.push(sample_expose);
            }
        });
        if (result.data.length==0) {
            result.data.push({"status":"No objects found."});
        }
        result.key = 'score';

        return true;
    }

    $scope.parsers.Score = function(data, result, model_name) {
        result.data = [];

        if (!(model_name in cache_private)) {
            cache_private[model_name] = [];
        }

        // sort by value
        function score_sorter(a,b) {
            return b.score - a.score;           //reverse sort
        }
        data.sort(score_sorter);

        $.each(data, function(i,sample) {
            if (i > $scope.config_user["Result Limit"]) return false;           //stop parsing
            var sample_expose = {'score':score_round(sample['value']), 'sample':result.sample };
            result.data.push(sample_expose);
        });

        if (result.data.length==0) {
            result.data.push({'score':"No data.", 'sample':-1 });
            cache_private[model_name] = [];
        }
        else {
            var model_lock_name = model_name+'_res';
            $.each(result.data, function(i,v) {
                cache_private[model_name].push(v);  // push to local cache
                $scope.fn.canvas_lock(v.sample, model_lock_name, 1);    //indicate that this model is using sample
            });
            cache_private[model_name].sort(score_sorter);
            while (cache_private[model_name].length > $scope.config_user["Result Limit"]) {  // truncate results
                var v = cache_private[model_name].pop();
                $scope.fn.canvas_lock(v.sample, model_lock_name, -1);    //indicate that this model is done with the sample
            }
            result.data = cache_private[model_name];    // copy full recent history; effectively CACHE results for next call
        }
        result.key = 'score';

        return true;
    }    

    /////////////////////////////////////////////////////
    // helper functions - graph visualization

    function score_round(score_input) {
        return Math.round(score_input*1000)/1000;
    }

    function BlobToDataURI(data, mime) {
        var b64encoded = btoa(Uint8ToString(data));
        return "data:"+mime+";base64,"+b64encoded;
    }

    // https://stackoverflow.com/a/12713326
    function Uint8ToString(u8a){
        var CHUNK_SZ = 0x8000;
        var c = [];
        for (var i=0; i < u8a.length; i+=CHUNK_SZ) {
            c.push(String.fromCharCode.apply(null, u8a.subarray(i, i+CHUNK_SZ)));
        }
        return c.join("");
    }
    
    function init() {
        // do anything additional here?
    }

    /////////////////////////////////////////////////////
    //private initialization
    init();

};

