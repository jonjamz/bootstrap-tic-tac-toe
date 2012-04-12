<?php

// Start session, create nonce
session_start();
$nnc = md5(session_id()); 
$_SESSION["nnc"] = $nnc;

?>
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-type" content="text/html; charset=utf-8">
  <title>Tic Tac Toe Basic</title>
  <link rel="stylesheet" type="text/css" href="/styles/bootstrap.css">
  <script src="/scripts/jquery.min.js"></script>
  <script src="/scripts/bootstrap.min.js" type="text/javascript"></script>
  <!--[if lt IE 9]>
  <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
  <![endif]-->
</head>
<body>
  <div class="row-fluid" style="text-align: center">
    <header>
        <h1 style="margin-bottom: 20px">Tic Tac Toe</h1>
    </header>
  </div>
  <div class="row-fluid" style="text-align: center">
    <a href="#" id="create-game" class="btn btn-primary large">Start a new game!</a>
    <br>
    <br>
    <img id="loader" style="display:none" src="/loading.gif">
  </div>
<script type="text/javascript">
$(document).ready(function() {
  // Disable AJAX cache
  $.ajaxSetup ({ cache: false });
  // Create a new game and redirect user to the right page
  $("#create-game").click(function() {
    $("#loader").show();
    $.post("awesome.php", { command: "create", nnc: "<?php echo $nnc; ?>" },
    function(data) {
      if (data.error) {
        alert(data.error);
        $("#loader").hide();
      }
      else if (data.hash) {
        window.location.href = "game/" + data.hash;
      }
    }, "json");
    return false;
  });
});
</script>
</body>
</html>