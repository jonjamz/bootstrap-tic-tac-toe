$(document).ready(function () {
  //---------------------------------
  /*  Receives _gameId and nnc vars from outside  */
  //---------------------------------
  /*  Disable AJAX caching  */
  $.ajaxSetup({ cache: false });
  //---------------------------------
  /*  SET VARS AND SOME DEFAULTS
   *  turn = 1, it's your turn. 0, it's the other person's turn. 2, flag to switch turns
   *  type = 1, you're x. 0, you're o
   *  boardState is a JSON array of the board as it is played
   *  userState is a JSON array of the user's info
   *  myXo and oppXo will hold x or o as defined by type
   *  curSquare is simply an outer scope var for dealing with squares
   *  myColorClass is your color, oppColorClass is the opponent's color
   *  myUserName is your username, oppUserName is the opponent's
   *  myState and oppState are populated by the user info from the server
   *  command tells the server how to process the incoming request
   *  lastTurn keeps track of the most recent turn
   *  lastPlayer keeps track of when a second player enters the game
   *  gameOver will be 1 when there has been a winner
   *  =============================== */
  var debug = 0,
    turn,
    type = 0,
    boardState = {},
    userState = {},
    time = 1000,
    myXo,
    oppXo,
    curSquare,
    myColorClass,
    oppColorClass,
    myUserName = undefined,
    oppUserName = "Opponent",
    myState,
    oppState,
    command,
    lastTurn,
    lastPlayer = 0,
    gameOver = 0;
  // Colors as Bootstrap CSS Classes
  var colorClasses = {
    first:  "btn btn-primary", 
    second: "btn btn-info", 
    third:  "btn btn-success", 
    fourth: "btn btn-warning", 
    fifth:  "btn btn-danger",
    sixth:  "btn btn-inverse"
  };
  //---------------------------------
  /*  FRONT-SIDE GAME EVENTS
   *  makeXo() determines what to put in a square when claimed
   *  pushBoard() serializes the current state of the board into the boardState object
   *  updateBoard() pushes board updates to the DOM after a server response
   *  pushUser() pushes the current state of the user to the userState object
   *  claimSquare() claims a square for a player
   *  claimColor() claims a color for a player
   *  addOppUserName() updates the opponent's username in the DOM
   *  addMyUserName() updates the current player's username in the DOM
   *  showMessage() and playerTurn() display messages across the bottom of the screen
   *  =============================== */
  function makeXo() {
    if (type === 0) {
      myXo = "o"; 
      oppXo = "x";
    }
    else {
      myXo = "x"; 
      oppXo = "o";
    }
  }
  // Serialize the current state of the board in a var
  function pushBoard() {
    var player, dtsq, addState = {};
    boardState = {};
    $('div.sq[data-taken="taken"]').each(function() {
      dtsq = $(this).attr("data-sq");
      player = $(this).attr("data-xo");
      addState[dtsq] = player;
      $.extend(boardState, addState);
    });
    turn = 2;
    console.log("turn has been changed to " + turn);
    playerTurn();
  }
  // Push board updates to the DOM after a server response
  function updateBoard() {
    var whoColorClass;
    $.each(boardState, function(i, val) {
      if (val === myXo) {
        whoColorClass = myColorClass;
      }
      else {
        whoColorClass = oppColorClass;
      }
      curSquare = $('div[data-sq="' + i + '"]');
      curSquare.attr("class", "span3 sq " + whoColorClass);
      curSquare.attr("data-xo", val);
      curSquare.attr("data-taken", "taken");
      $("#your-name").attr("class", myColorClass);
      $("#opponent-name").attr("class", oppColorClass);
    });
  }
  // Serialize the state of the current user
  function pushUser() {
    userState = {};
    userState = { player: nnc, username: myUserName, type: type, turn: turn, color: myColorClass };
  }
  // Take a square during a turn
  function claimSquare(sq) {
    curSquare = $('[data-sq="' + sq + '"]');
    curSquare.addClass(myColorClass);
    curSquare.attr("data-xo", myXo);
    curSquare.attr("data-taken","taken");
  }
  // Push the current user's chosen color to the DOM
  function claimColor(key) {
    myColorClass = colorClasses[key];
    $("#your-name").attr("class", myColorClass);
    $('[data-xo="' + myXo + '"]').attr("class", "span3 sq " + myColorClass);
    //alert(myColorClass);
  }
  // Add an opponent's updated username to the DOM
  function addOppUserName() {
    $("#opponent-name").val(oppUserName);
  }
  // Add current user's updated username to the DOM
  function addMyUserName() {
    $("#your-name").val(myUserName);
  }
  // Show and fade an alert box with message
  function showMessage(message) {
    $(".message")
      .stop(true)
      .fadeIn(1000)
      .html(message)
      .delay(5000)
      .fadeOut(1000);
  }
  // Messages about whose turn it is
  function playerTurn() {
    var message;
    if (turn === 1) {
      message = "It's your turn!";
    }
    else {
      message = "It's " + oppUserName + "'s turn!";
    }
    showMessage(message);
  }
  //---------------------------------
  /*  GAME TRIGGERS
   *  =============================== */
  $(".game-container").on("click", ".sq", function() {
    if (turn === 1) {
      if ($(this).attr("data-taken") !== "taken") {
        claimSquare($(this).attr("data-sq"));
        pushBoard();
      }
      else {
        alert("Square taken!");
      }
    }
    else {
      alert("It's not your turn!");
    }
    return false;
  });
  // Claim a color if not taken
  $(".color-choices").on("click", "a", function() {
    var colorKey = $(this).attr("data-colorKey");
    if(colorClasses[colorKey] === oppColorClass) {
      alert("Can't take the opponent's color!");
    }
    else {
      claimColor(colorKey);
    }
    return false;
  });
  // Change name variable on key up
  $("#your-name").keyup(function() {
    myUserName = $(this).val();
  });
  // Debug toggle
  $("#debug").click(function() {
    if (debug === 0) {
      debug = 1;
    }
    else if (debug === 1) {
      debug = 0;
    }
  });
  //---------------------------------
  /*  INTERFACING WITH SERVER
   *  =============================== */
  function poll() {
    // Serialize user info into a variable to send
    pushUser();
    // Add current turn state to lastTurn
    lastTurn = turn;
    // If it's your turn, it's ok to post board updates
    if (turn === 1) {
      command = "update";
    }
    // If you just went, this flags to change turns
    else if (turn === 2) {
      command = "switch";
    }
    // If it's not your turn, just receive
    else {
      command = "request";
    }
    $.post("/awesome.php", { 
      command: command, 
      hash: _gameId, 
      userState: userState, 
      boardState: boardState, 
      nnc: nnc 
    },
    function(data) {
      if (debug === 1) {
        console.log("i am player " + type);
        console.log("turn is " + turn);
        console.log("command is " + command);
        console.log(JSON.stringify(data));
      }
      // If our type is 0, player_1_state is the current user's 
      // and player_2_state is the opponent's
      // and vice versa
      if (type === 0) {
        myState = data.player_1_state;
        oppState = data.player_2_state;
        if (data.player_2_state && lastPlayer === 0) {
          showMessage("Player 2 has entered the game!");
          lastPlayer = 1;
        }
      }
      else if (type === 1) {
        myState = data.player_2_state;
        oppState = data.player_1_state;
      }
      // Update turn
      if (myState.turn) {
        if (myState.turn === "2") {
          turn = 0;
        }
        else {
          turn = myState.turn*1;
        }
      } 
      else {
        if (type === 0) {
          turn = 1;
        } 
        else {
          turn = 0;
        }
      }
      // Show message if it's just become the current user's turn
      if (myState.turn === "1" && lastTurn === 0) {
        playerTurn();
      }
      // Establish colors for both players
      if (oppState.color) {
      	oppColorClass = oppState.color;
      }
      if (myState.color) {
        myColorClass = myState.color;
      }
      // Push everything to the board
      if (data.board_state) {
        boardState = {};
        $.extend(boardState, data.board_state);
        updateBoard();
      }
      // Update names
      if (oppState.username) {
      	oppUserName = oppState.username;
        addOppUserName();
      }
      if (myState.username) {
        if(myUserName === undefined) {
          myUserName = myState.username;
          addMyUserName();
        }
        else if (myUserName !== myState.username) {
          //--> Do nothing
        }
      }
      // If there's a winner, end the game
      if (data.winner === "0" || data.winner === "1") {
        gameOver = 1;
        var winnerName;
        if ((type === 0 && data.winner === "0") || (type === 1 && data.winner === "1")) {
          winnerName = "You";
        } else {
          winnerName = oppUserName;
        }
        alert("Game over! " + winnerName + " has won the match!");
      }
    }, "json");
    // Start it all over again if the game's not over!
    if (gameOver === 0) {
      setTimeout(poll,time);
    }
  }
  // On landing, check if the game exists, and if there is already a player. 
  // If the game doesn't exist, display error and return to home page
  // If there is already a player, make the appropriate assignments to this one
  $.post("/awesome.php", { command: "check", hash: _gameId, nnc: nnc },
  function (data) {
    if (data.error) {
      showMessage(data.error);
      setTimeout(function(){
        window.location.href = "/index.php";
      }, 3400);
    }
    else if (data.hash) {
      // Start polling if the game exists, figure out player status
      if (data.player === "first") {
        //--> Do nothing, type is already 0!
      }
      else if (data.player === "second") {
        type = 1;
      }
      else if (data.player === "third") {
        // Redirect home
        window.location.href = "/kicked.php";
      }
      // Start off with a color
      if (type === 0) {
        claimColor("first");
      }
      else if (type === 1) {
        claimColor("second");
      }
      // Make xo
      makeXo();
      // Start polling the db, bruh!
      poll();
    }
  }, "json");
  //---------------------------------
  /*  STYLING
   *  Makes squares resize proportionally
   *  =============================== */
  function squareHeights() {
    $(".sq").css({"height":$(".sq").width() + "px"});
  }
  $(window).resize(function() { squareHeights(); });
  squareHeights();
});