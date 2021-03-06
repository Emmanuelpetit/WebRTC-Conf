var quickconnect = require('rtc-quickconnect');
var captureConfig = require('rtc-captureconfig');
var media = require('rtc-media');
var crel = require('crel');
var qsa = require('fdom/qsa');
var tweak = require('fdom/classtweak');
var reRoomName = /^\/room\/(.*?)\/?$/;
var room = location.pathname.replace(reRoomName, '$1').replace('/', '');
var Draggabilly = require('draggabilly');
var Dropzone = require("dropzone");


// local & remote video areas
var local = qsa('.local')[0];
var remotes = qsa('.remote');


// data channel & peers
var channel;
var peerMedia = {};

// use google's ice servers
var iceServers = [
    {url: 'stun:stun.l.google.com:19302'}
    // { url: 'turn:192.158.29.39:3478?transport=udp',
    //   credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    //  username: '28224511:1379330808'
    // },
    // { url: 'turn:192.158.29.39:3478?transport=tcp',
    //   credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    //   username: '28224511:1379330808'
    // }
];

// capture local media
var localMedia = media({
    constraints: captureConfig('camera min:1280x720').toConstraints()
});


// Connexion à socket.io
var socket = io.connect('http://' + location.hostname + ':3000');

// On demande le pseudo, on l'envoie au serveur et on l'affiche dans le titre
var pseudo = prompt('Quel est votre pseudo ?');
socket.emit('nouveau_client', pseudo);
document.title = pseudo + ' - ' + document.title;

// On crée l'événement recupererParticipants pour récupérer directement les participants sur le serveur
socket.on('recupererParticipants', function (participants) {
    //réinitialisation de la liste des participants au niveau graphique lors des éventuelles màj de cette dernière
    $('#list_parts').children('li').remove();
    // participants est le tableau contenant tous les participants qui ont été écris sur le serveur
    for (var i = 0; i < participants.length; i++) {
        $('#list_parts').prepend('<li><em>' + participants[i] + '</em></li>');
    }
});

// Quand on reçoit un message, on l'insère dans la page
socket.on('message', function (data) {
    insereMessage(data.pseudo, data.message);
});

// On affiche le dossier partagé à tous les participants
socket.on('afficherFolder', function (data) {
    $("#tree").html(data);
    $('#files').tree({
        expanded: 'li:first'
    });
});

function downloadFile(file) {
    $.get('/download', file);
}

// Affichage de la zone de D&D
$(function () {


    var prw = '<div id="preview-template">Hello</div>';

    Dropzone.options.myAwesomeDropzone = {
        maxFilesize: 10,
        // createImageThumbnails: false,
        previewsTemplate: prw,
        previewsContainer: previewZone,
        init: function () {
            this.on("error", function (file) {
                alert("Error during the upload, pleasy try again");
            });
        }
    };

});


// Quand un nouveau client se connecte, on affiche l'information
socket.on('nouveau_client', function (pseudo) {
    $('#list_chat').prepend('<li><em>' + pseudo + ' a rejoint la conversation !</em></li>');
    $('#list_parts').prepend('<li><em>' + pseudo + '</em></li>');
});

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
    if ($('.st-menu-open').is(':visible')) {
        $('#contener').children('.notif').remove();
    }
}
// Lors de l'ouverture du chat, on supprime aussi la notif
$('#contener').click(function () {
    $('#contener').children('.notif').remove();
});

// Ajoute un message interne dans la page
function insereMyMessage(pseudo, message) {
    $('#list_chat').prepend('<li class="block-envoye"> <div class="pseudo-envoye">' + pseudo + '</div> <div class="message-envoye">' + message + '</div></li>');
}

// Appel au serveur pour récuperer le descripteur du dossier partagé
function loadFolder() {
    var socket = io.connect();
    socket.emit('getFolder');
}


// Quand un client se déconnecte, on affiche l'information
socket.on('disconnect', function (pseudo) {
    $('#list_chat').prepend('<li><em>' + pseudo + ' a quitt&eacute; la conversation !</em></li>');
    //$('#list_parts>li').remove( ":contains('" + pseudo +"')" );
});
//////////////////////
$('#invitation').click(function () {
    var dest = prompt('Entrez le mail du destinataire');
    var url = 'http://' + location.hostname + ':3000/room/main';
    socket.emit('invitation', {pseudo: pseudo, destinataire: dest, url: url});
});

/////////////////////////////Micro Control
//$('#micro').click(function(stream) { // stream is your local WebRTC stream
//  var audioTracks = stream.getAudioTracks();
//  for (var i = 0, l = audioTracks.length; i < l; i++) {
//    audioTracks[i].enabled = !audioTracks[i].enabled;
//  }
//});

////////////////////////////////////////////////////////////////

// start Drag n Drop
$('#draggableBtn').click(function () {
    $('.remote').children('video').addClass('draggable');
    var element = document.querySelectorAll('.draggable');

    var i;
    for (i = 0; i < element.length; i++) {

        element[i].style.cursor = "move";

        var draggie = new Draggabilly(element[i]);

        function onDragMove(instance, event, pointer) {
            console.log('dragMove on ' + event.type +
                    pointer.pageX + ', ' + pointer.pageY +
                    ' position at ' + instance.position.x + ', ' + instance.position.y);
        }
        // bind event listener
        draggie.on('dragMove', onDragMove);
        // un-bind event listener
        draggie.off('dragMove', onDragMove);
        // return true to trigger an event listener just once
        draggie.once('dragMove', function () {
            console.log('Draggabilly did move, just once');
        });
    }
});
// end Drag n Drop

// render a remote video
function renderRemote(id, stream) {
    var activeStreams;

    // create the peer videos list
    peerMedia[id] = peerMedia[id] || [];

    activeStreams = Object.keys(peerMedia).filter(function (id) {
        return peerMedia[id];
    }).length;

    console.log('current active stream count = ' + activeStreams);
    peerMedia[id] = peerMedia[id].concat(media(stream).render(remotes[activeStreams % 2]));
}

function removeRemote(id) {
    var elements = peerMedia[id] || [];

    // remove old streams
    console.log('peer ' + id + ' left, removing ' + elements.length + ' elements');
    elements.forEach(function (el) {
        el.parentNode.removeChild(el);
    });
    peerMedia[id] = undefined;
}

// render our local media to the target element
localMedia.render(local);

// once the local media is captured broadcast the media
localMedia.once('capture', function (stream) {
    // handle the connection stuff
    quickconnect(location.href + '../../', {
        // debug: true,
        room: room,
        iceServers: iceServers
    })
            .addStream(stream)
            .createDataChannel('chat')
            .on('stream:added', renderRemote)
            .on('stream:removed', removeRemote)
            .on('channel:opened:chat', function (id, dc) {
                qsa('.chat').forEach(tweak('+open'));
            });
});

loadFolder();