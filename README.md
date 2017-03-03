# nanoprofilejs

# Client side resize and determine orientation of an image



 Perform client side image resize and rotation operation as needed prior to uploading. 
 Using canvas element to resize image to specific size.
 Reads exif data to extract the orientation.

 Note: This is heavy duty duct-tape programming.
       Cleaned up a bit and pre-packaged.
       Standing on the shoulders of giants. \0/
 
# Code is heavily based on the following sources (very few changes made):

 1) Exif rotation handling: 
    https://gist.github.com/runeb/c11f864cd7ead969a5f0
 
 2) Aspect ratio: 
    http://stackoverflow.com/questions/3971841/how-to-resize-images-proportionally-keeping-the-aspect-ratio
 
 3) http://stackoverflow.com/questions/6965107/converting-between-strings-and-arraybuffers
 
 4) http://stackoverflow.com/questions/20396165/change-css3-transform-value
 
 5) Client side image resize 
    http://stackoverflow.com/questions/23945494/use-html5-to-resize-an-image-before-upload


# Example usage:

  <!-- hidden fields used to post data on form submit -->
  <input type=hidden id="imageDataInput">
  <input type=hidden id="imageTransformInput">

<!-- image display / preview on upload/resize -->
  <div id="previewDiv" style="padding:20px;" />

<!-- the file upload control -->
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


<!-- To display the image anywhere else after its been saved (using rails) -->

<img style="border-radius:5px; 
            transform: <%= profile.profile_image_css_rotation %>;"  
            src="<%=profile.profile_image_data %>"
            width="80px"/>

