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
 pad.canvas.js - angular backend for canvas operations in PAD
*/

function CanvasControl($scope, options)
{
    /////////////////////////////////////////////////////
    // private data
    var color_set = [  "#FFFF00", "#00FF00", "#FF0000", "#00FFFF", "#0000FF", "#FF00FF", 
                     "#FFBFBF", "#FFFFBF", "#BFFFBF", "#BFFFFF", "#BFBFFF", "#FFBFFF"];  // colors for rect and highlight
    var dom_active = {};    // name-referenced front canvases
    
    var canvas_queue = {};  // queue for images/canvases that have been processed
    var canvas_default = null;  // permanent reference for default canvas (placeholder image)
    var canvas_idx = 0; // index of last canvas added
    var video_interval_timer = null;

    /////////////////////////////////////////////////////
    // exposed functions
    $scope.fn.canvas_color = function(r_color_idx) {
        return color_set[r_color_idx % color_set.length];
    }

    // draw a region in the source canvas 
    $scope.fn.canvas_rect = function(dom_id, clear_first, r_left, r_top, r_width, r_height, r_color_idx) {
        if (!r_color_idx) r_color_idx = 0;

        var line_width = 4;
        // console.log("CANVAS DOM:"+dom_id);
        var src_canvas = canvas_get(dom_id);
        
        var ctx = src_canvas.getContext('2d');
        if (clear_first) {
            ctx.clearRect(0, 0, src_canvas.width, src_canvas.height);
        }

        //key to starting different colors
        ctx.beginPath();
        ctx.lineWidth=line_width;
        var offsWidth = Math.floor(line_width/2);
        ctx.strokeStyle = $scope.fn.canvas_color(r_color_idx);
        ctx.moveTo(r_left+offsWidth, r_top+offsWidth);
        ctx.lineTo(r_left+offsWidth+r_width, r_top+offsWidth);
        ctx.lineTo(r_left+offsWidth+r_width, r_top+offsWidth+r_height);
        ctx.lineTo(r_left+offsWidth, r_top+offsWidth+r_height);
        ctx.lineTo(r_left+offsWidth, r_top+offsWidth);
        ctx.stroke();
        //ctx.strokeRect(r_left+line_width, r_top+line_width, r_width, r_height);
        // console.log("[canvas_rect]: "+r_left+","+r_top+"x"+r_width+","+r_height+", color:"+ctx.strokeStyle);
    }

    $scope.fn.canvas_lock = function(canvas_idx_ref, model_name, lock_state) {
        // NOTE: challenge is to keep a two locks:  (a) use in data send, (b) display on screen
        //  must keep (a) when not displayed, must keep (b) for subsequent scope updates
        // lock_state: 1=new lock, 0=remove soft locks (anywhere this ID exists), -1=remove explicit ID lock

        if (!(canvas_idx_ref in canvas_queue)) return;      // unknown sample, stop now
        var time_now = (new Date()).getTime();

        if (lock_state==1) {   // creating type (a) 
            canvas_queue[canvas_idx_ref]['locks'].push(model_name);
            // console.log('[lock]: Adding new canvas lock '+canvas_idx_ref+' for model '+model_name);
        }
        else {  // releasing type (b)
            var delete_queue = [];
            var queue_check = canvas_queue;
            if (lock_state==-1) {   // if only look for a specific canvas, save that one
                queue_check = {};
                queue_check[canvas_idx_ref] = 1;
            }
            var num_queue = 0;
            $.each(queue_check, function(k,v) {  // scan through other items to look for lock here not matching reference
                if (k == canvas_idx_ref) return true;   // skip current sample
                var v = canvas_queue[k];
                var del_idx = v['locks'].indexOf(model_name);   // search for old locks
                if (del_idx != -1) {
                    v['locks'].splice(del_idx, 1);   // only remove this item
                    // console.log('[lock]: Deleting canvas lock '+k+'('+lock_state+'), for '+model_name+', new length:'+v['locks'].length);
                }
                if (v['locks'].length == 0) {    // set destruction time
                    delete_queue.push(k);   // push frame reference for deletion
                }
                num_queue++;
            });
            $.each(delete_queue, function(i,k) {    // do actual cleanup
                // console.log('[lock]: Deleting canvas '+k);
                delete canvas_queue[k];
            });
            // console.log('[lock]: New canvas_queue length: '+(num_queue-delete_queue.length));
        }
    }


    // reset queue of canvas items
    $scope.fn.canvas_reset = function() {
        canvas_queue = {};
        canvas_idx = canvas_default==null ? -1 : 0;
    }

    // retrieve canvas URL for selected item
    $scope.fn.canvas_data = function(canvas_idx_ref) {
        if (canvas_idx_ref==undefined) return;
        if (canvas_idx_ref >= canvas_idx || !(canvas_idx_ref in canvas_queue)) {
            if (canvas_idx_ref != -1) {
                var warnMsg = "Attempt to get missing sample '"+canvas_idx_ref+"'";
                console.log("[canvas_data]:"+warnMsg);
                // $scope.fn.alert_create(warnMsg, 'warning');
            }
            return canvas_default==null ? "" : canvas_default;
        }
        return canvas_queue[canvas_idx_ref]['data'];
    }

    // similar ot canvas draw, but use a stored sample idx
    $scope.fn.sample_draw = function(sample_idx, model_name, fn_success) {
        var img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = function () {
            var canvas_new = canvas_draw(img, model_name);
            if (fn_success) fn_success(model_name);
            img.onload = null;
        }
        img.src = $scope.fn.canvas_data(sample_idx);  //copy source, let image load
    };

    //image queue from a video or image and store a canvas URL for retrieval
    //  dom_obj is either an image ID or a full-fledged HTMLVideoElement Object
    $scope.fn.image_queue = function(dom_obj, is_video, model_name, fn_success) {
        if (model_name==undefined || model_name==null) model_name=$scope.root_sync_model;

        // grab an image from the DOM object, 
        // convert to canvas object, 
        // queue canvas URL with a specific sample number, 

        if (!is_video) {
            dom_obj = $('#'+dom_obj);
            if (dom_obj.length==0) return;
            var img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = function () {
                var canvas_new = canvas_draw(img, model_name);
                var canvas_idx_new = canvas_add(canvas_new.toDataURL('image/jpeg', 1.0));
                if (fn_success) fn_success(model_name, canvas_idx_new);
                img.onload = null;
            }
            img.src = dom_obj.attr('src');  //copy source, let image load
        }
        else {
            var canvas_new = canvas_draw(dom_obj, model_name);
            var canvas_idx_new = canvas_add(canvas_new.toDataURL('image/jpeg', 1.0));
            if (fn_success) fn_success(model_name, canvas_idx_new);
        }
    };

    $scope.fn.video_switch = function(fn_image_switch) {
        var dom_video = document.getElementById($scope.root_sync_video);
        // console.log(dom_video);
        if (!dom_video) return;
        dom_video.play();

        // restart video sampling
        if (video_interval_timer != null) 
            clearInterval(video_interval_timer);
        if (!fn_image_switch) {
            $scope.fn.alert_create("Error: Missing frame-based callback for video", 'critical');
            // NOTE: as authors, we know this is actually the '$scope.fn.image_queue' function, but it uses 
            //  a root callback as one of its arguments for the first frame, so we forward the request
            return;
        }
        video_interval_timer = setInterval(video_frame_grab, 
            $scope.config_user["Frame Sample Period (ms)"], fn_image_switch);
    }

    $scope.fn.video_toggle = function(dom_event) {
        //https://stackoverflow.com/a/41488898
        var dom_video = angular.element(dom_event.target)[0];
        if (dom_video.paused) {
            dom_video.play();
        }
        else {
            dom_video.pause();
        }
    }

    $scope.fn.video_camera_enable = function(dom_event) {
        // Grab elements, create settings, etc.
        var video = document.getElementById(dom_event);

        // Get access to the camera!
        if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            // Not adding `{ audio: true }` since we only want video now
            navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
                //video.src = window.URL.createObjectURL(stream);
                video.srcObject = stream;
                video.play();
            });
        }
    }

    /////////////////////////////////////////////////////
    // helper functions

    // interval function for sampling frames from the video
    function video_frame_grab(fn_image_switch) {
        var dom_video = document.getElementById($scope.root_sync_video);
        if (!dom_video || !fn_image_switch) return;
        if (dom_video.ended || dom_video.paused) return; 
        fn_image_switch(dom_video);
    }

    // trick for two-canvas fetch (essentially using a frame buffer https://en.wikipedia.org/wiki/Framebuffer#Page_flipping)
    function canvas_get(dom_id) {
        if (!(dom_id in dom_active)) {
            dom_active[dom_id] = document.getElementById('canvas_'+dom_id);
            var domFwd = $('#canvas_'+dom_id);
            // var id_copy = domFwd.attr('id')+'_clone';
            // domFwd.clone().attr('id', id_copy).appendTo(domFwd.parent());
            // dom_canvas_back[dom_id] = document.getElementById(id_copy);
            // $('#'+id_copy).hide();
        }
        return dom_active[dom_id];
    }

    function canvas_add(canvas_new) {
        var canvas_idx_new = canvas_idx;
        if (canvas_idx_new == -1) {
            canvas_default = canvas_new;
        }
        else {
            canvas_queue[canvas_idx_new] = {'data':canvas_new, 'locks':[] }
        }
        canvas_idx++;
        return canvas_idx_new;
    }


    function canvas_draw(img, model_name, fn_success) {
        var canvas = canvas_get(model_name, true);
        var ctx = canvas.getContext('2d');
        var canvasCopy = document.createElement("canvas");
        var copyContext = canvasCopy.getContext("2d");

        var ratio = 1;

        // render image to local image
        // grab canvas of same name
        // draw on canvas context
        // call callback
        var imgW = img.width;
        var imgH = img.height;
        if (img.nodeName == "VIDEO") {
            imgW = img.videoWidth;
            imgH = img.videoHeight;
        }

        // https://stackoverflow.com/a/2412606
        if(imgW > $scope.config_user["Max Canvas/Buffer Width"])
            ratio = $scope.config_user["Max Canvas/Buffer Width"] / imgW;
        if(ratio*imgH > $scope.config_user["Max Canvas/Buffer Height"])
            ratio = $scope.config_user["Max Canvas/Buffer Height"] / imgH;

        // console.log("Canvas Copy:"+canvasCopy.width+"/"+canvasCopy.height);
        // console.log("Canvas Ratio:"+ratio+", "+model_name);
        // console.log("Image Sizes:"+imgW+"/"+imgH);

        canvasCopy.width = imgW;
        canvasCopy.height = imgH;
        copyContext.drawImage(img, 0, 0);

        canvas.width = imgW * ratio;
        canvas.height = imgH * ratio;
        ctx.drawImage(canvasCopy, 0, 0, canvasCopy.width, canvasCopy.height, 0, 0, canvas.width, canvas.height);

        if (fn_success) fn_success(model_name);

        return canvas;
    }

    function init() {
        // save a copy of the defauly image/canvas data
        if ('default' in options) {
            canvas_idx = -1;
            $scope.fn.image_queue(options['default'], false, null);
        }
    }


    /////////////////////////////////////////////////////
    //private initialization
    init();

};

