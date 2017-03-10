/*
 Author: SE.
 Date: 03-MAR-17

 Perform client side image resize and rotation operation as needed prior to uploading. 
 Using canvas element to resize image to specific size.
 Reads exif data to extract the orientation.

 Note: This is heavy duty duct-tape programming.
       Cleaned up a bit and pre-packaged.
       Standing on the shoulders of giants. \0/
 
 Code is heavily based on the following sources (very few changes made):

 1) Exif rotation handling: 
    https://gist.github.com/runeb/c11f864cd7ead969a5f0
 
 2) Aspect ratio: 
    http://stackoverflow.com/questions/3971841/how-to-resize-images-proportionally-keeping-the-aspect-ratio
 
 3) http://stackoverflow.com/questions/6965107/converting-between-strings-and-arraybuffers
 
 4) http://stackoverflow.com/questions/20396165/change-css3-transform-value
 
 5) Client side image resize 
    http://stackoverflow.com/questions/23945494/use-html5-to-resize-an-image-before-upload


 Example usage:

  <!-- hidden fields used to post data on form submit -->
  <input type=hidden id="imageDataInput">
  <input type=hidden id="imageTransformInput">

<!-- image display / preview on upload/resize -->
  <div id="previewDiv" style="padding:20px;" />

<-- the file upload control -->
  <input name = "imagefile[]" 
         type = "file" 
           id = "photoUpload" 
       accept = "image/*" 
     onChange = "new NanoProfile().uploadPhotos('photoUpload', 
                                  200, null, 'previewDiv', 
                                  completionCallback, 
                                  'imageDataInput', 
                                  'imageTransformInput')" />




<!-- Called on page load to set the preview from hidden field data 
      after it's been saved. -->
  <script>  


  function completionCallback(object){
    console.log("client completionCallback function called ");
    //console.log(JSON.stringify(object) );
    alert("url length: "+ object.url.length)
  }


    $(function() {
      var imageData = document.getElementById('imageDataInput').value, 
      var imageXform = document.getElementById('imageTransformInput').value, 
  
      if (imageData)  
        new NanoProfile().appendPreview('previewDiv', 
                          200, 200, 200, imageData, imageXform, 
                          '5px'
                          )
    });
  </script>


<!-- To display the image anywhere else after its been saved (rails) -->

<img style="border-radius:5px; 
            transform: <%= profile.profile_image_css_rotation %>;"  
            src="<%=profile.profile_image_data %>"
            width="80px"/>
*/



///////////////////////////////////////////////////////////////////
// Core public API methods.
///////////////////////////////////////////////////////////////////

/*
 Purpose:
 Call to resize and if needed automatically adjust rotation.
*/
NanoProfile.prototype.uploadPhotos = function(id, MAX_SIZE, ratio, 
                                              previewDivId, 
                                              clientCompletionHandler,
                                              imageDataInputId, 
                                              imageTransformInputId,
                                              borderRadius
                                              ){
    MAX_SIZE = MAX_SIZE || 200
    ratio = ratio || null
    borderRadius = borderRadius || '5px'

    var file = document.getElementById(id).files[0];
    var that = this;
    var css_rotation = null;
    var switch_width_and_height = false;

    // Exif orientation value to css transform mapping
    // Does not include flipped orientations
    var rotation = {
      1: 'rotate(0deg)',
      3: 'rotate(180deg)',
      6: 'rotate(90deg)',
      8: 'rotate(270deg)'
    };

    this.orientation(file, function (imageData, value) {
        console.log(rotation[value]);
        that.css_rotation = rotation[value]
        //if we have to rotate to 90 then the width and height are switched.
        if (value == 6 || value == 8)
          that.switch_width_and_height = true;
        }
    );

    // Ensure it's an image
    if(file.type.match(/image.*/)) {

        // Load the image
        var reader = new FileReader();
        reader.onload = function (readerEvent) {
            var image = new Image();

            image.onload = function (imageEvent) {
                // Resize the image
                var canvas = document.createElement('canvas'),
                    max_size = MAX_SIZE,
                    width = image.width,
                    height = image.height;
                
                if (width > height) {
                    if (width > max_size) {
                        height *= max_size / width;
                        width = max_size;
                    }
                } else {
                    if (height > max_size) {
                        width *= max_size / height;
                        height = max_size;
                    }
                }
                
                if (ratio){
                  height = getHeight(MAX_SIZE,ratio);
                  width  = getWidth(height,ratio);
                  console.log('Using aspect ratio calculation')
                  console.log(height);
                  console.log(width);
                }

                canvas.width  = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(image, 0, 0, width, height);

                //debugger;
                var w, h;
                if (that.switch_width_and_height == true){
                  h = width;
                  w = height
                }else{
                  w = width;
                  h = height;
                }

                var dataUrl = canvas.toDataURL('image/png');
                var resizedImage = that.dataURLToBlob(dataUrl);
                var result = {
                    type: "imageResized",
                    blob: resizedImage,
                    url: dataUrl,
                    css_rotation: that.css_rotation,
                    canvas_width: w,
                    canvas_height: h,
                    max_size: max_size
                }

                that.completionHandler(result, 
                                      previewDivId, 
                                      clientCompletionHandler, 
                                      imageDataInputId, 
                                      imageTransformInputId,
                                      borderRadius );                 
            }
            image.src = readerEvent.target.result;
        }
        reader.readAsDataURL(file);
    }
};

NanoProfile.prototype.appendPreview = function(previewDivId, 
                                             width, height,
                                             max_size, 
                                             imageData, 
                                             cssTransform,
                                             borderRadius
                                            ) {

  var pId = 'nano_profile_preview_image';
  var image = document.createElement("img");
  image.src = imageData;

  if (height > width)
    image.height = max_size;
  else
    image.width = max_size;

  //image.width = width;
  //image.height = height;
  image.id = pId;
  image.style.transform = cssTransform;
  image.style.borderRadius = borderRadius;
  var placeholder = document.getElementById(previewDivId);
  
  //remove anything already there.
  var current = document.getElementById(pId);
  if (current)
    current.parentNode.removeChild(current)

  placeholder.appendChild(image);
}

/*
 Call to show a preview of the imageData using the transform.

NanoProfile.prototype.showPreview = function(previewImageId, 
                                             width, height, 
                                             imageData, 
                                             cssTransform,
                                             borderRadius
                                            ) {
    var pi = document.getElementById(previewImageId);
    pi.width  = width;
    pi.height = height;
    pi.src = imageData;
  
    if (cssTransform)
      pi.style.transform = cssTransform;
    if (borderRadius)
      pi.style.borderRadius = borderRadius;
}
*/

// Helper for aspect ratio convenience.
NanoProfile.prototype.getAspectRatios = function() {
  return {
     a:(4/3),
     b:(5/4),
     c:(16/10),
     d:(16/9)
  }
}


///////////////////////////////////////////////////////////////////
// Implementation details follow.
///////////////////////////////////////////////////////////////////
NanoProfile.prototype.completionHandler = function(result, 
                                                   previewDivId,
                                                   clientCompletionHandler,
                                                   imageDataInputId,
                                                   imageTransformInputId,
                                                   borderRadius) {
  if (previewDivId) {
    this.appendPreview(previewDivId, 
                    result.canvas_width, 
                    result.canvas_height, 
                    result.max_size,
                    result.url, 
                    result.css_rotation,
                    borderRadius);
  } 

  // internal notes of possible interest.
  // 
  // Use createObjectURL to make a URL for the blob.
  // var _url = URL.createObjectURL(event.blob);
  // document.getElementById('img').src = _url
  
  // eg) rails hidden fields - this goes in your own completion handler if you prefer.
  if (imageDataInputId) //'profile_profile_image_data'
    document.getElementById(imageDataInputId).value = result.url; 

  if (imageTransformInputId)  //'profile_profile_image_css_rotation'
    document.getElementById(imageTransformInputId).value = result.css_rotation; 

  clientCompletionHandler(result);
}

function NanoProfile(){
  //constructor
}

NanoProfile.prototype.orientation = function(file, callback) {
  var fileReader = new FileReader();
  var that = this;

  fileReader.onloadend = function() {
    var base64img = "data:"+file.type+";base64," + that._arrayBufferToBase64(fileReader.result);
    var scanner = new DataView(fileReader.result);
    var idx = 0;
    var value = 1; // Non-rotated is the default
    if(fileReader.result.length < 2 || scanner.getUint16(idx) != 0xFFD8) {
      // Not a JPEG
      if(callback) {
        callback(base64img, value);
      }
      return;
    }
    idx += 2;
    var maxBytes = scanner.byteLength;
    while(idx < maxBytes - 2) {
      var uint16 = scanner.getUint16(idx);
      idx += 2;
      switch(uint16) {
        case 0xFFE1: // Start of EXIF
          var exifLength = scanner.getUint16(idx);
          maxBytes = exifLength - idx;
          idx += 2;
          break;
        case 0x0112: // Orientation tag
          // Read the value, its 6 bytes further out
          // See page 102 at the following URL
          // http://www.kodak.com/global/plugins/acrobat/en/service/digCam/exifStandard2.pdf
          value = scanner.getUint16(idx + 6, false);
          maxBytes = 0; // Stop scanning
          break;
      }
    }
    if(callback) {
      callback(base64img, value );
    }
  }
  fileReader.readAsArrayBuffer(file);
};

NanoProfile.prototype._arrayBufferToBase64 = function( buffer ) {
  var binary = ''
  var bytes = new Uint8Array( buffer )
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode( bytes[ i ] )
  }
  return window.btoa( binary );
}

NanoProfile.prototype.getHeight = function(length, ratio) {
  var height = ((length)/(Math.sqrt((Math.pow(ratio, 2)+1))));
  return Math.round(height);
}

NanoProfile.prototype.getWidth = function(length, ratio) {
  var width = ((length)/(Math.sqrt((1)/(Math.pow(ratio, 2)+1))));
  return Math.round(width);
}

/* Utility function to convert a canvas to a BLOB */
NanoProfile.prototype.dataURLToBlob = function(dataURL) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
        var parts = dataURL.split(',');
        var contentType = parts[0].split(':')[1];
        var raw = parts[1];
        return new Blob([raw], {type: contentType});
    }

    var parts = dataURL.split(BASE64_MARKER);
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;
    var uInt8Array = new Uint8Array(rawLength);
    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], {type: contentType});
}

//unused - left for reference.
NanoProfile.prototype.ab2str = function (buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

//unused - left for reference.
NanoProfile.prototype.str2ab = function(str) {
  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}


