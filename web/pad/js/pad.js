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
 pad.js - angular backend for interaction with Pipeline Application Demo

 E. Zavesky 12/04/18 initial creation of PAD interface
 */

"use strict";

/*
 * Control for selecting different date range
*/

var app = angular
.module('pad', ['ngSanitize', 'ngCookies'])
.config(function($sceDelegateProvider) {
    // https://stackoverflow.com/a/28501975
    $sceDelegateProvider.resourceUrlWhitelist(['**']);
})
.directive("fileInput",["$parse",function($parse){
    // https://github.com/turbobuilt/angular-file-input -- MIT license
    return {
      link: function($scope, $element, $attrs, $ngModelCtrl){
        function createFileInput(){
          var fileInput = document.createElement("input");
          fileInput.type = "file";
          angular.element(fileInput).on("change",function(event){
            $scope.$apply(function(){
              $parse($attrs.onChange)($scope, {$event:event});
            })
            //remove old input
            fileInput.remove();
            //create new file input
            createFileInput();
          })
          $element.append(fileInput);
        }
        createFileInput();
      }
    }
}])
.controller('padCtrl', ['$scope', '$window', '$timeout', '$cookies', '$interval',
    function ($scope, $window, $timeout, $cookies, $interval)
{   
    /////////////////////////////////////////////////////
    // private variables within this control
    var video_time_stop = null; 
    var asset_all = {};
    var asset_uploads = [];
    var async_wait = 0;
    var class_examples = ['mark', 'sad', 'relevant', 'running', 'dog', 'long multi-line class name', 'example', 'colorful', 'sunlight'];

    /////////////////////////////////////////////////////
    // "global" data to be initialized here for in-class assignment
    $scope.fn = {};
    $scope.config = {};
    $scope.config.version = "0.1";
    $scope.config.horizontal = true;
    $scope.config.help_show = true;
    $scope.root_sync_model = 'all';
    $scope.root_camera_asset = 'camera_asset';
    $scope.root_sync_video = 'source_video';
    
    $scope.config_user = {};    // these options are configurable
    $scope.config_user["Root Server"] = 'http://localhost';
    $scope.config_user["Result Limit"] = 10;
    $scope.config_user["Frame Sample Period (ms)"] = 500;
    $scope.config_user["Length of Average Window"] = 5;
    $scope.config_user["Max Canvas/Buffer Width"] = 640;
    $scope.config_user["Max Canvas/Buffer Height"] = 480;
    $scope.config_user["Simulate Results For Assets"] = 0;
    
    $scope.playlist = { 'enabled': true, 'list':null, 'id':null, 'clip':''};

    $scope.config.state = {'pipeline':'none', 'configuration':'assets/config/main.json', 'asset':null};       //serialized to/from URL
    $scope.pipelines = { 
        'none': {'name':'none', 'models':null } // null means none
    };
    $scope.assets = { };    //asset list

    $scope.models = {};
    $scope.results = {};
    $scope.results[$scope.root_sync_model] = {'order':-1};

    $scope.alerts = [];     //alert list

    /////////////////////////////////////////////////////
    // security functions
    if(!String.prototype.startsWith){  // no like IE - https://stackoverflow.com/a/913741
        String.prototype.startsWith = function (str) {
            return !this.indexOf(str);
        }
    }

    /////////////////////////////////////////////////////
    // exposed functions

    $scope.fn.alert_create = function(msgNew, alertType, timeDissolve, hrefLink) {
        if (timeDissolve==undefined) timeDissolve=3000;
        if (!alertType) alertType='info';
        var newObj = {msg: msgNew, type:alertType, timeout:null};
        if (hrefLink) newObj['link'] = hrefLink;
        if (timeDissolve > 0) {
            newObj.timeout = $timeout(function() {
                $scope.fn.alert_close_msg(msgNew);
            }, timeDissolve);
        }
        $scope.alerts.push(newObj);
        console.log(msgNew);       //TODO: graphical display, too
    }

    $scope.fn.alert_keep = function(index) {
        if ($scope.alerts[index]['timeout'] == null) return;
        $timeout.cancel($scope.alerts[index]['timeout']);
        $scope.alerts[index]['timeout'] = null;
    };
    
    $scope.fn.alert_close_msg = function(msgNew) {
        var index = null;
        $.each($scope.alerts, function(iAlert, vAlert) {
            if (vAlert.msg==msgNew) {
                index = iAlert;
                return false;
            }
        })
        if (index!=null) {
            $scope.fn.alert_close(index);
        }
    };

    $scope.fn.alert_close = function(index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.fn.asset_select = function(asset_ref, force_select, fn_success) {
        $scope.fn.parse_clear_cache();
        if (force_select) {
            asset_ref = $scope.config.state.asset;
        }
        else if ($scope.config.state.asset == asset_ref) return;

        if (!(asset_ref in asset_all)) {
            if (asset_ref != null)
                $scope.fn.alert_create("Asset reference '"+asset_ref+"' not found in known assets!", 'danger');
            if (fn_success) fn_success();
            return;
        }

        //async test for load/update - runs ONCE during app init
        var dom_asset = $('#'+asset_ref);
        if (dom_asset.length == 0) {
            $timeout(function() {
                $scope.fn.asset_select(asset_ref, force_select, fn_success);
            }, 1000);
            return;
        }                          

        var opt_asset = asset_all[asset_ref];
        $scope.fn.alert_create("Changing asset to '"+opt_asset.name+"'", 'info');
        if (asset_ref == $scope.root_camera_asset) {
            // CAMERA: - https://davidwalsh.name/browser-camera
            // Get access to the camera!
            if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                console.log("[camera] Seeking user approval.");
                // Not adding `{ audio: true }` since we only want video now
                navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
                    console.log("[camera] Attempting to allocate stream.");
                    //video.src = window.URL.createObjectURL(stream);
                    assets[config.state.asset].movie = stream;
                    // video.play();
                });
            }
        }
        $scope.config.state.asset = asset_ref;

        $scope.fn.canvas_reset();   //reset canvas queue
        $.each($scope.results, function(key, val) {
            stat_empty(key);
            if ($scope.config_user["Simulate Results For Assets"]!=0) {
                $scope.fn.ingest_results(key, 0, null);
                // console.log($scope.results[key].last);
            }
            else {
                $scope.fn.ingest_results(key, -1, null, "No data received.");
            }
        })
        url_update();

        // clearInterval(hd.frameTimer);	// stop the processing
        // hd.video.pause();

        $scope.results[$scope.root_sync_model].enabled = true;
        if ('movie' in opt_asset) {
            $timeout(function() {
                $scope.fn.video_switch(function(dom_src) {
                    $scope.fn.image_queue(dom_src, true, $scope.root_sync_model, image_process_root);
                });
            }, 1000);
        }
        else {
            //encode image data and send image post as success function
            $scope.fn.image_queue(asset_ref, false, $scope.root_sync_model, image_process_root);
        }
        if (fn_success) fn_success();
    }

    $scope.fn.url_export = function() {
        // console.log("PATH/offset: "+video_path+"/"+video_offset);
        $scope.fn.alert_create("Creating snapshot URL...", 'warning');
    }

    $scope.fn.config_download = function() {
        if (!$scope.config.state.configuration.length) {
            $scope.fn.alert_create("Attempting to access asset but no content loaded!", 'danger');
        }
        var urlTarget = $scope.config.state.configuration;
        $window.open(urlTarget, 'Asset Metadata - '+Math.random());
    };

    $scope.fn.pipeline_select = function(fnComplete) {
        if (!($scope.config.state.pipeline in $scope.pipelines)) {
            $scope.fn.alert_create("Missing pipeline  '"+$scope.config.state.pipeline+"', abort change", 'danger');
            if (fnComplete) fnComplete();
            return false;
        }
        var opt = $scope.pipelines[$scope.config.state.pipeline];
        $scope.fn.alert_create("Changed pipeline to '"+opt.name+"'", 'warning');

        $.each($scope.results, function(key, val) {
            stat_empty(key);
            if (opt.models == null) {
                val.enabled = val.visible = false;
            }
            else if (opt.models.length == 0) {
                val.enabled = val.visible = true;
            }
            else {
                val.enabled = val.visible = (opt.models.indexOf(key) != -1);
            }
            val.blocked = false;
        });    

        //walk through and select only assets that fit this pipeline
        $scope.assets = {};
        var asset_keys = opt.content;
        if (asset_keys==null) {     // specify null assets, grab them all!
            asset_keys = [];
            $.each(asset_all, function(contentN, contentV) {
                asset_keys.push(contentN);
            });
        }
        $.each(asset_keys, function(idxA, nameA) {
            asset_include(nameA, idxA);
        });
        $.each(asset_uploads, function(idxA, nameA) {
            asset_include(nameA, idxA+1000);
        });

        url_update();
        if (fnComplete) fnComplete();
    };

    $scope.fn.model_toggle = function(model_name, new_state) {
        if (new_state != undefined)
            $scope.results[model_name].enabled = new_state;
        else 
            $scope.results[model_name].enabled = !$scope.results[model_name].enabled;

        // for dependents on this model, update their 'blocked' indicator on our new state
        $.each($scope.results[model_name].source_downstream, function(i, k) {
            $scope.results[k].blocked = !$scope.results[model_name].enabled;
        });
    };

    $scope.fn.ingest_results = function(model_name, result_idx, result_data, error_str, result_type) {
        if ($scope.results[model_name].blocked || !$scope.results[model_name].enabled) return;

        if (result_idx > -1)
            $scope.results[model_name].stats.samples++;     // update stats 
        if ($scope.results[model_name].stats.waiting != null) {
            var time_run = (new Date()) - $scope.results[model_name].stats.waiting;
            // console.log(model_name+" last run time: "+time_run);
            stat_accumulate(model_name, time_run, 'latency');
            $scope.results[model_name].stats.waiting = null;
        }
        $scope.results[model_name].last = {'sample':result_idx, 'data':null, "key":'status', 'color':null };
        if (!(model_name in $scope.models)) {        // not a model, just update directly.
            // $scope.fn.canvas_draw(model_name);
            return true;
        }

        var good_process = false;
        if (result_data!=null) {
            if (result_type in $scope.parsers) {          // search for known type
                good_process = $scope.parsers[result_type](result_data, $scope.results[model_name].last, model_name);
            }
            else {
                error_str = "Unknown result ingest '"+result_type+"' (model "+model_name+")";
                $scope.fn.alert_create(error_str, 'warning');
                console.log({"type":result_type, "data":result_data});
                return $scope.fn.ingest_results(model_name, -1, null, error_str);
            }
            if (good_process) {
                $timeout(function() {
                    stat_refresh();
                    $scope.$apply(function () {
                        // do something else?
                    });
                }, 500);                        
                return true;
            }
        }

        console.log("ERROR or SIMULATE: "+model_name);
        if ($scope.models[model_name].template == 'template_class') {
            var data_example = [];
            if (error_str) {            // ERROR condition
                data_example = [{"status":error_str}];
            }
            else {                     // simulate data
                var idx_start = Math.round(Math.random()*class_examples.length);
                for (var i=0; i<5; i++) {   // simulate some data
                    data_example.push({
                        'class':class_examples[(idx_start+i)%class_examples.length],
                        'score':Math.round(Math.random()*100)/100
                    });
                }
                $scope.results[model_name].last.key = 'score';
            }
            $scope.results[model_name].last.data = data_example;
        }
        else if ($scope.models[model_name].template == 'template_frames') {
            var data_example = [];
            if (error_str) {            // ERROR condition
                data_example = [{'score':error_str, 'sample':-1 }];
            }
            else {
                data_example = [{'score':"No data.", 'sample':-1 }];
            }
            $scope.results[model_name].last.data = data_example;
            good_process = false;
        }
        else if ($scope.models[model_name].template == 'template_image') {
            //pass as NULL and placeholder image will come up
            $scope.results[model_name].last.data = null;
            good_process = false;

            // TODO: create a place holder for no results
        }
        return good_process;
    };

    // respond to upload/post of image and call selection
    $scope.fn.upload_image = function(file_event) {
        if (file_event.target.files && file_event.target.files[0]) {
            const reader = new FileReader();
          
            reader.onload = ((e) => {
                // console.log(e);
                var nameA = "upload-"+asset_uploads.length;
                asset_all[nameA] = {
                    "url": e.target['result'],
                    "source": "",
                    "name": "Upload "+asset_uploads.length
                };
                // console.log(asset_all[nameA]);
                asset_uploads.push(nameA);
                asset_include(nameA, asset_uploads.length+1);
                $scope.fn.alert_create("Adding new asset ("+nameA+")", 'info');
                $timeout(function() {
                    $scope.fn.asset_select(nameA, false);
                }, 1000);
            });
            reader.readAsDataURL(file_event.target.files[0]);
            // console.log(file_event.target.files[0]);
        }
    }

    /////////////////////////////////////////////////////
    // local functions

    function asset_include(nameA, idxA) {
        if (!(nameA in asset_all)) return;
        var optA = asset_all[nameA];
        $scope.assets[nameA] = {'name':optA.name, 'url':optA.url, 'idx':idxA, 
                                'movie':('movie' in optA) ? optA.movie : null};
    }

    function image_process_root(proto_name, sample_idx) {
        // added to save root server to params
        if (!$scope.config.state.url || $scope.config.state.url != $scope.config_user["Root Server"]) {
            $scope.config.state.url = $scope.config_user["Root Server"];
            url_update();
        }
        $scope.fn.canvas_lock(sample_idx, $scope.root_sync_model, 1);    //indicate that this model is using sample
        $scope.fn.ingest_results(proto_name, sample_idx, null);
        var fn_success = $scope.fn.proto_propagate(proto_name, sample_idx);
        $scope.fn.canvas_lock(sample_idx, $scope.root_sync_model, 0);    //indicate that this model is displaying sample
        return fn_success;
    }

    function stat_refresh() {
        var stat_fields = {'dropped':0, 'latency':0 };  // update for display
        var stat_count = 0;
        $.each($scope.results, function(k,v){   // walk all modules
            if (k != $scope.root_sync_model && v.enabled && !v.stats.error) {  // valid other sample
                $.each(stat_fields, function(f, n) {
                    stat_fields[f] += v.stats[f];
                });
                stat_count++;
            }
        });
        $.each(stat_fields, function(f,n) { // perform average
            stat_accumulate($scope.root_sync_model, n/stat_count, f);
        });
    }

    function url_fetch() {
        var vars = {};
        var parts = window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
            vars[key] = value;
        });
        return vars;
    }

    function url_update() {
        var list_param = [ ];
        $.each($scope.config.state, function(k, v) {
            if (v != null)
                list_param.push(k+'='+v);
        });
        var params = '?' + list_param.join('&');
        history.pushState(null, null, params);
    }
    
    function name_clean(name) {
        var catName = 'id_' + name.replace(/[\" \/]+/g, '_').toLowerCase();
        return catName;
    }

    function msToTime(s) {
        // Pad to 2 or 3 digits, default is 2
        function pad(n, z) {
            z = z || 2;
            return ('00' + n).slice(-z);
        }
        var ms = s % 1000;
        s = (s - ms) / 1000;
        var secs = s % 60;
        s = (s - secs) / 60;
        var mins = s % 60;
        var hrs = (s - mins) / 60;
        return pad(hrs) + ':' + pad(mins) + ':' + pad(secs); // + '.' + pad(ms, 3);
    }

    function stat_empty(name) {
        $scope.results[name].stats = {
            'samples':0, //count of processed samples
            'latency':0, //latency in milliseconds between images
            'has_input':false,  //has input proto ready?
            'has_output':false, //has output proto ready?
            'waiting':null, //Date() instance if waiting 
            'dropped':0, //number of samples dropped
            'error':0   // experienced an error
        };
        $scope.results[name].last = {};
    }

    function stat_accumulate(name, value, field) {
        //accumulate stat or reset it if value or vield is null
        if (!(name in $scope.results)) {
            $scope.results[name] = {};
        }
        if (!('stats' in $scope.results[name]) || value==null || field==null) {
            stat_empty(name);
            return;
        }
        if (!(field in $scope.results[name].stats)) return;     //bad field reference
        var value_key = field+'_values';
        if (!(value_key in $scope.results[name].stats)) // dynamically create value store
            $scope.results[name].stats[value_key] = [];
        var value_count = $scope.results[name].stats[value_key].length+1;
        $scope.results[name].stats[value_key].push(value);
        if (value_count > $scope.config_user["Length of Average Window"])  {     //ran over? remove last value
            var val_remove = $scope.results[name].stats[value_key].splice(0, 1);
            value_count--;
            $scope.results[name].stats[field] = Math.max(0, (($scope.results[name].stats[field] * value_count) - val_remove)/(value_count-1));
        }
        $scope.results[name].stats[field] = (($scope.results[name].stats[field]*(value_count-1)) + value)/value_count;    //recompute avg
        // console.log(name+": "+$scope.results[name].stats[field]+", "+value_count);
        // console.log(name+": "+$scope.results[name].stats[value_key]);
        $scope.results[name].stats[field] = Math.round($scope.results[name].stats[field] * 100)/100;
    }

    function init_module() {
        $("#loadingModal").modal('show');
        CanvasControl($scope, {'default':'canvas_default'});
        ProtoControl($scope, {}, $timeout);
        ParserControl($scope, {});

        $scope.config.state = $.extend(true, $scope.config.state, url_fetch());

        // special copy mode for the propagation url
        if ('url' in $scope.config.state) {
            $scope.config_user["Root Server"] = $scope.config.state.url;
        }

        $.ajax({
            url: $scope.config.state.configuration, 
            dataType: 'json',
            data: null,
            success:
        function(json) {
            console.log(json);

            $scope.models = $.extend($scope.models, json.models);
            $scope.pipelines = $.extend($scope.pipelines, json.pipelines);
            asset_all = json.content;
    
            //TODO: more testing on live camera feed?
            /*
            //also add a video/camera feed to asset
            asset_all[$scope.root_camera_asset] = {
                "movie": null,
                "url": "assets/placeholder.jpg",
                "source": "",
                "name": "user camera"
            };
            asset_uploads.push($scope.root_camera_asset);
            */

            async_wait = 0;
            $scope.results[$scope.root_sync_model].source_downstream = [];

            $.each($scope.models, function(k,v) {
                stat_accumulate(k, null);

                $scope.results[k].enabled = true;
                if ('proto' in v) {
                    async_wait++;
                    $scope.fn.protobuf_load(k, v.proto, v.method, function() {
                        async_wait--;   //within callback function, decrement "done" counter
                        if (async_wait==0) {
                            $scope.fn.pipeline_select(function(){       // success on pipeline
                                $scope.fn.asset_select(null, true, function() {     //success on asset
                                    $timeout(function() {
                                        $("#loadingModal").modal('hide'); 
                                    }, 500);
                                });
                            });
                        }
                    });
                }

                $scope.results[k].source_downstream = [];   //allow downstream need tracking
                if (v.source != null) {
                    $scope.results[v.source].source_downstream.push(k);
                }
                else {
                    $scope.results[$scope.root_sync_model].source_downstream.push(k);
                }
    
                //add another entry to 'scope.models'
            });
        },
        error:function() {
            $scope.fn.alert_create('Critical error, can not continue. Bad configuration or JSON parsing, check configuration parameter.', 'danger', -1);
            $timeout(function() {
                $("#loadingModal").modal('hide'); 
            }, 500);
        } });

        //video_load(x);
    }

    /////////////////////////////////////////////////////
    // final initializer code
    init_module();

}]);