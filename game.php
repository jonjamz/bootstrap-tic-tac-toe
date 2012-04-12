<?php

include 'header.php';

?>

<body>
  <div class="row-fluid title">
    <header>
        <h1 style="margin-bottom: 20px"><a href="/index.php" style="color:#000" title="Go home">Tic Tac Toe</a> 
          <small class="label label-info" style="margin-left: 10px">
            Copy the link above to invite an opponent!
          </small> 
          <small class="pull-right">
            <a href="#" id="debug">toggle console msg</a>
          </small>
        </h1>
        <div class="btn-group" id="choose-color" style="margin-left: 0; margin-right: 10px; float: left">
          <a class="btn" href="#">Your color</a>
          <a class="btn dropdown-toggle" data-toggle="dropdown" href="#"><span class="caret"></span></a>
          <ul class="dropdown-menu color-choices">
            <li><a href="#" data-colorKey="first" class="btn-primary">&nbsp;</a></li>
            <li><a href="#" data-colorKey="second" class="btn-info">&nbsp;</a></li>
            <li><a href="#" data-colorKey="third" class="btn-success">&nbsp;</a></li>
            <li><a href="#" data-colorKey="fourth" class="btn-warning">&nbsp;</a></li>
            <li><a href="#" data-colorKey="fifth" class="btn-danger">&nbsp;</a></li>
            <li><a href="#" data-colorKey="sixth" class="btn-inverse">&nbsp;</a></li>
          </ul>
        </div>
      <input type="text" id="your-name" class="btn btn-primary" placeholder="Your name" style="margin-bottom: 10px">
      &nbsp; vs. &nbsp; 
      <input type="text" class="btn" disabled="disabled" id="opponent-name" value="Opponent" style="margin-bottom: 10px">
    </header>
  </div>
  <div class="game-container" style="padding-left: 10px;">
    <div class="row-fluid game">
        <div class="span3 sq btn" data-sq="1">&nbsp;</div>
        <div class="span3 sq btn" data-sq="2">&nbsp;</div>
        <div class="span3 sq btn" data-sq="3">&nbsp;</div>
    </div>
    <div class="row-fluid game">
        <div class="span3 sq btn" data-sq="4">&nbsp;</div>
        <div class="span3 sq btn" data-sq="5">&nbsp;</div>
        <div class="span3 sq btn" data-sq="6">&nbsp;</div>
    </div>
    <div class="row-fluid game">
        <div class="span3 sq btn" data-sq="7">&nbsp;</div>
        <div class="span3 sq btn" data-sq="8">&nbsp;</div>
        <div class="span3 sq btn" data-sq="9">&nbsp;</div>
    </div>
  </div>
  <div class="message"></div>
<script type="text/javascript" src="/scripts/ttt.js"></script>
</body>
</html>