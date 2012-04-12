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
  <link rel="stylesheet" type="text/css" href="/styles/ttt.css">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <script src="/scripts/jquery.min.js"></script>
  <script src="/scripts/bootstrap.min.js" type="text/javascript"></script>
  <script type="text/javascript">
  var _gameId = "<?php echo $_GET["id"]; ?>",
  nnc = "<?php echo $nnc; ?>";
  </script>
  <!--[if lt IE 9]>
  <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
  <![endif]-->
</head>