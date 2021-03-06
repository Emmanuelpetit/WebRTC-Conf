var Draggabilly = require('draggabilly');

// Connexion à socket.io
var socket = io.connect('http://'+location.hostname + ':3000');

// On demande le pseudo, on l'envoie au serveur et on l'affiche dans le titre
var pseudo = prompt('Quel est votre pseudo ?');
socket.emit('nouveau_client', pseudo);
document.title = pseudo + ' - ' + document.title;

// On crée l'événement recupererParticipants pour récupérer directement les participants sur le serveur
socket.on('recupererParticipants', function(participants) {
  //réinitialisation de la liste des participants au niveau graphique lors des éventuelles màj de cette dernière
  $('#list_parts').children('li').remove();
  // participants est le tableau contenant tous les participants qui ont été écris sur le serveur
  for (var i = 0; i < participants.length; i++){
    $('#list_parts').prepend('<li><em>' + participants[i] + '</em></li>');
  }
});

// Quand on reçoit un message, on l'insère dans la page
socket.on('message', function(data) {
  insereMessage(data.pseudo, data.message);
})

// Quand un nouveau client se connecte, on affiche l'information
socket.on('nouveau_client', function(pseudo) {
  $('#list_chat').prepend('<li><em>' + pseudo + ' a rejoint la conversation !</em></li>');
  $('#list_parts').prepend('<li><em>' + pseudo + '</em></li>');
})

// Lorsqu'on envoie le formulaire, on transmet le message et on l'affiche sur la page
$('#formulaire_chat').submit(function () {
  var message = $('#message').val();
  socket.emit('message', message); // Transmet le message aux autres
  insereMyMessage(pseudo, message); // Affiche le message aussi sur notre page
  $('#message').val('').focus(); // Vide la zone de Chat et remet le focus dessus
  return false; // Permet de bloquer l'envoi "classique" du formulaire
});

// Ajoute un message venant de l'exterieur
function insereMessage(pseudo, message) {
  $('#list_chat').prepend('<li class="block-recu"> <div class="pseudo-recu">' + pseudo + '</div> <div class="message-recu">' + message + '</div></li>');
  
  // Supprime l'ancienne notification
  $('#contener').children('.notif').remove();
  // Affiche la nouvelle notification
  $('#contener').append('<img id="notif" class="notif" alt="notif" src="../../img/notification.png" />');
  // Si le chat est ouvert, on supprime la notif
  if($('.st-menu-open').is(':visible')) {
    $('#contener').children('.notif').remove();
  }
}
// Lors de l'ouverture du chat, on supprime aussi la notif
$('#contener').click(function() {
  $('#contener').children('.notif').remove();
});

// Ajoute un message interne dans la page
function insereMyMessage(pseudo, message) {
  $('#list_chat').prepend('<li class="block-envoye"> <div class="pseudo-envoye">' + pseudo + '</div> <div class="message-envoye">' + message + '</div></li>');
}

// Quand un client se déconnecte, on affiche l'information
socket.on('disconnect', function(pseudo) {
  $('#list_chat').prepend('<li><em>' + pseudo + ' a quitt&eacute; la conversation !</em></li>');
  //$('#list_parts>li').remove( ":contains('" + pseudo +"')" );
})
//////////////////////
$('#invitation').click(function() {
  var dest = prompt('Entrez le mail du destinataire');
  var url = 'http://'+location.hostname + ':3000/room/main';
  socket.emit('invitation', {pseudo: pseudo, destinataire: dest, url: url});
});

// start Drag n Drop
$('#draggableBtn').click(function() {
  $('#participants').children('video').addClass('draggable');
    var element = document.querySelectorAll('.draggable');

  var i;
  for (i = 0; i < element.length; i++) {

	element[i].style.cursor = "move";

    var draggie = new Draggabilly(element[i]);
	
    function onDragMove( instance, event, pointer ) {
      console.log( 'dragMove on ' + event.type +
      pointer.pageX + ', ' + pointer.pageY +
      ' position at ' + instance.position.x + ', ' + instance.position.y );
    }
    // bind event listener
    draggie.on( 'dragMove', onDragMove );
    // un-bind event listener
    draggie.off( 'dragMove', onDragMove );
    // return true to trigger an event listener just once
    draggie.once( 'dragMove', function() {
      console.log('Draggabilly did move, just once');
    });
  }
});
// end Drag n Drop