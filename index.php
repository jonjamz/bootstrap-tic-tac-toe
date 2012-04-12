<?php

include 'header.php';

?>

<body>
  <div class="row-fluid" style="text-align: center">
    <header>
      <h1>Tic Tac Toe</h1>
    </header>
  </div>
  <div class="row-fluid" style="text-align: center">
      <a href="#" id="create-game" class="btn btn-primary large">Start a new game!</a>
      <br><br>
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