$(document).ready(function () {
  //---------------------------------
  /*  Receives _gameId and nnc vars from outside  */
  //---------------------------------
  /*  Disable AJAX caching  */
  $.ajaxSetup({ cache: false });
  //---------------------------------
  /*  SET PROPERTIES AND SOME DEFAULTS
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
   *  spectator lets you watch without being able to play
   *  firstPoll turns to 1 after the first poll
   *  =============================== */
  var params = {
    debug: 0,
    turn: undefined,
    type: 0,
    boardState: {},
    userState: {},
    myXo: undefined,
    oppXo: undefined,
    curSquare: false,
    myColorClass: undefined,
    oppColorClass: undefined,
    myUserName: undefined,
    oppUserName: "Opponent",
    myState: undefined,
    oppState: undefined,
    command: undefined,
    lastTurn: undefined,
    lastPlayer: 0,
    gameOver: 0,
    spectator: 0,
    firstPoll: 0
  };
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
   *  claimColor() claims a color for a player, updateColor() updates the color
   *  addOppUserName() updates the opponent's username in the DOM
   *  addMyUserName() updates the current player's username in the DOM
   *  showMessage() and playerTurn() display messages across the bottom of the screen
   *  spectate() sets up the environment for spectator mode
   *  =============================== */
  function makeXo() {
    if (params.type === 0) {
      params.myXo = "o"; 
      params.oppXo = "x";
    }
    else {
      params.myXo = "x"; 
      params.oppXo = "o";
    }
  }
  // Serialize the current state of the board in a var
  function pushBoard() {
    var player, dtsq, addState = {};
    params.boardState = {};
    $('div.sq[data-taken="taken"]').each(function() {
      dtsq = $(this).attr("data-sq");
      player = $(this).attr("data-xo");
      addState[dtsq] = player;
      $.extend(params.boardState, addState);
    });
    console.log("Turn has been changed to " + params.turn);
    playerTurn();
  }
  // Push board updates to the DOM after a server response
  function updateBoard() {
    var whoColorClass;
    $.each(params.boardState, function(i, val) {
      if (val === params.myXo) {
        whoColorClass = params.myColorClass;
      }
      else {
        whoColorClass = params.oppColorClass;
      }
      curSquare = $('div[data-sq="' + i + '"]');
      curSquare.attr("class", "span3 sq " + whoColorClass);
      curSquare.attr("data-xo", val);
      curSquare.attr("data-taken", "taken");
    });
    updateColor();
  }
  // Serialize the state of the current user
  function pushUser() {
    params.userState = {};
    params.userState = { 
      player: nnc, 
      username: params.myUserName, 
      type: params.type, 
      turn: params.turn, 
      color: params.myColorClass 
    };
  }
  // Take a square during a turn
  function claimSquare(sq) {
    curSquare = $('[data-sq="' + sq + '"]');
    curSquare.addClass(params.myColorClass);
    curSquare.attr("data-xo", params.myXo);
    curSquare.attr("data-taken","taken");
  }
  // Push the current user's chosen color to the DOM
  function claimColor(key) {
    params.myColorClass = colorClasses[key];
    $("#your-name").attr("class", params.myColorClass);
    $('[data-xo="' + params.myXo + '"]').attr("class", "span3 sq " + params.myColorClass);
  }
  // Update the current user's color when received from db
  function updateColor() {
    $("#your-name").attr("class", params.myColorClass);
    $("#opponent-name").attr("class", params.oppColorClass);
  }
  // Add an opponent's updated username to the DOM
  function addOppUserName() {
    $("#opponent-name").val(params.oppUserName);
  }
  // Add current user's updated username to the DOM
  function addMyUserName() {
    $("#your-name").val(params.myUserName);
  }
  // Show and fade an alert box with message
  function showMessage(message) {
    $(".message")
      .stop(true, true)
      .fadeIn(1000)
      .html(message)
      .delay(2000);
  }
  function showAlert(message) {
    $(".big-alert")
      .stop(true, true)
      .fadeIn()
      .html(message)
      .delay(3000)
      .fadeOut();
  }
  // Messages about whose turn it is
  function playerTurn() {
    var message;
    if (params.turn === 1) {
      message = "It's your turn!";
    }
    else {
      message = "It's " + params.oppUserName + "'s turn!";
    }
    showMessage(message);
  }
  // Initiate spectator mode
  function spectate() {
    params.spectator = 1;
    params.turn = 0;
    showMessage("You are a spectator");
    $("#choose-color").remove();
    $("#your-name").attr("disabled", "disabled");
  }
  //---------------------------------
  /*  GAME TRIGGERS
   *  =============================== */
  $(".game-container").on("click", ".sq", function() {
    if (params.gameOver === 0 && params.spectator === 0) {
      if (params.turn === 1) {
        if (params.myColorClass !== undefined) {
          if ($(this).attr("data-taken") !== "taken") {
            params.turn = 2;
            soundManager.play("clickSquare");
            claimSquare($(this).attr("data-sq"));
            pushBoard();
          }
          else {
            showAlert("Square taken!");
          }
        }
        else {
          showAlert("Please choose a color!");
        }
      }
      else {
        showAlert("It's not your turn!");
      }
    }
    else {
      showAlert("The game is over! Don't be greedy!");
    }
    return false;
  });
  // Claim a color if not taken
  $(".color-choices").on("click", "a", function() {
    if (params.spectator === 0) {
      var colorKey = $(this).attr("data-colorKey");
      if(colorClasses[colorKey] === params.oppColorClass) {
        showAlert("Can't take the opponent's color!");
      }
      else {
        claimColor(colorKey);
      }
    }
    $(".dropdown-toggle").trigger("click");
    return false;
  });
  // Change name variable on key up
  $("#your-name").keyup(function() {
    if (params.spectator === 0) {
      params.myUserName = $(this).val();
    }
  });
  // Debug toggle
  $("#debug").click(function() {
    if (params.debug === 0) {
      params.debug = 1;
    }
    else if (debug === 1) {
      params.debug = 0;
    }
  });
  //---------------------------------
  /*  INTERFACING WITH SERVER
   *  =============================== */
  function poll() {
    // Serialize user info into a variable to send
    if (params.firstPoll === 1) {
      pushUser();
    }
    // Add current turn state to lastTurn
    params.lastTurn = params.turn;
    // If it's your turn, it's ok to post board updates
    if (params.turn === 1 && params.spectator === 0) {
      params.command = "update";
    }
    // If you just went, this flags to change turns
    else if (params.turn === 2 && params.spectator === 0) {
      params.command = "switch";
    }
    // Is it spectator mode?
    else if (params.spectator === 1) {
      params.command = "spectate";
    }
    // If it's not your turn, just receive
    else {
      params.command = "request";
    }
    $.post("/awesome.php", { 
      command: params.command, 
      hash: _gameId, 
      userState: params.userState, 
      boardState: params.boardState, 
      nnc: nnc 
    },
    function(data) {
      if (params.debug === 1) {
        console.log("i am player " + params.type);
        console.log("turn is " + params.turn);
        console.log("command is " + params.command);
        console.log("spectator is " + params.spectator);
        console.log(JSON.stringify(data));
      }
      // If our type is 0, player_1_state is the current user's 
      // and player_2_state is the opponent's
      // and vice versa
      if (params.type === 0) {
        params.myState = data.player_1_state;
        params.oppState = data.player_2_state;
        // If the second player has certain properties, and lastPlayer is 0
        // They just entered, so show an alert and play a sound
        if (data.player_2_state.type === "1" && params.lastPlayer === 0 && params.spectator === 0) {
          showAlert("Player 2 has entered the game!");
          soundManager.play("enterGame");
          params.lastPlayer = 1;
        }
      }
      else if (params.type === 1) {
        params.myState = data.player_2_state;
        params.oppState = data.player_1_state;
      }
      // Update turn
      if (params.myState.turn) {
        if (params.myState.turn === "2" || params.spectator === 1) {
          params.turn = 0;
        }
        else {
          params.turn = params.myState.turn*1;
        }
      } 
      else {
        if (params.type === 0 && params.spectator === 0) {
          params.turn = 1;
        } 
        else {
          params.turn = 0;
        }
      }
      // Show turn info if the game is running
      if (params.gameOver === 0) {
        playerTurn();
      }
      // Establish colors for both players 
      if (params.oppState.color) {
      	params.oppColorClass = params.oppState.color;
      }
      if (params.myState.color) {
        if (params.myColorClass === undefined) {
          params.myColorClass = params.myState.color;
        }
      }
      // Push everything to the board
      if (data.board_state) {
        params.boardState = {};
        $.extend(params.boardState, data.board_state);
        updateBoard();
      }
      // Update names
      if (params.oppState.username) {
      	params.oppUserName = params.oppState.username;
        addOppUserName();
      }
      if (params.myState.username) {
        if (params.myUserName === undefined) {
          params.myUserName = params.myState.username;
          addMyUserName();
        }
        else if (params.myUserName !== params.myState.username) {
          //--> Do nothing
        }
      }
      // If there's a winner, end the game
      if (data.winner === "0" || data.winner === "1") {
        var winnerName;
        if ((params.type === 0 && data.winner === "0") || (params.type === 1 && data.winner === "1")) {
          winnerName = params.myUserName;
        } else {
          winnerName = params.oppUserName;
        }
        if (params.gameOver === 0) {
          showMessage("Game over! " + winnerName + " has won the match!");
        }
        params.gameOver = 1;
      }
    }, "json");
    // Start it all over again if the game's not over!
    if (params.gameOver === 0) {
      setTimeout(poll,time);
    }
    // Set firstPoll
    params.firstPoll = 1;
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
        //--> Do nothing
      }
      else if (data.player === "second") {
        params.type = 1;
      }
      else if (data.player === "third") {
        // Redirect home
        // window.location.href = "/kicked.php";
        //--> or...
        // Start spectator mode
        spectate();
      }
      // Assign x or o, start AJAX polling
      makeXo();
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