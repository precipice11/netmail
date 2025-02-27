document.addEventListener('DOMContentLoaded', function() {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#reply').addEventListener('click', compose_email);
  document.querySelector('#email-view').style.display = 'none';
  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email(email = null) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields by default
  let recipientsField = document.querySelector('#compose-recipients');
  let subjectField = document.querySelector('#compose-subject');
  let bodyField = document.querySelector('#compose-body');

  if (email) {
    // Pre-fill reply fields
    recipientsField.value = email.sender;
    subjectField.value = email.subject.startsWith("Re: ") ? email.subject : `Re: ${email.subject}`;
    bodyField.value = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
  } else {
    // New email: clear fields
    recipientsField.value = '';
    subjectField.value = '';
    bodyField.value = '';
  }

  // Get the input data from the fields
  document.querySelector('#compose-form').addEventListener('submit', function(event) {
    event.preventDefault();

    let recipients = document.querySelector('#compose-recipients').value;
    let subject = document.querySelector('#compose-subject').value;
    let body = document.querySelector('#compose-body').value;

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log(result);
      load_mailbox('sent');
    })
});

  
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';


  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  if (mailbox === 'sent') {
    fetch('/emails/sent')
    .then(response => response.json())
    .then(emails => {
        emails.forEach(function(email) {
          const element = document.createElement('div');
          element.innerHTML = `To: ${email.recipients} | ${email.subject} | ${email.timestamp}`
          element.addEventListener('click', () => load_email(email.id));
          document.querySelector('#emails-view').append(element);
          element.style.border = '1px solid black';
          if (email.read == true) {
            element.style.backgroundColor = 'gray';
          };
        });
    });
  } else if (mailbox === 'inbox') {
    fetch('/emails/inbox')
    .then(response => response.json())
    .then(emails => {
        emails.forEach(function(email) {
          const element = document.createElement('div');
          element.innerHTML = `From ${email.sender} | ${email.subject} | ${email.timestamp}`
          element.addEventListener('click', () => load_email(email.id));
          document.querySelector('#emails-view').append(element);
          element.style.border = '1px solid black';
          if (email.read == true) {
            element.style.backgroundColor = 'gray';
          };
        });
    });
  } else if (mailbox === 'archive'){
    fetch('/emails/archive')
    .then(response => response.json())
    .then(emails => {
        emails.forEach(function(email) {
          const element = document.createElement('div');
          element.innerHTML = `From ${email.sender} | ${email.subject} | ${email.timestamp}`
          element.addEventListener('click', () => load_email(email.id));
          document.querySelector('#emails-view').append(element);
          element.style.border = '1px solid black';
          element.style.backgroundColor = 'gray';
        });
    });

  }
}


let archiveButton;

function load_email(email_id) {
  fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      });

      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#email-view').style.display = 'block';

      document.querySelector('.from').innerHTML = `From: ${email.sender}`;
      document.querySelector('.to').innerHTML = `To: ${email.recipients}`;
      document.querySelector('.subject').innerHTML = `Subject: ${email.subject}`;
      document.querySelector('.timestamp').innerHTML = `Timestamp: ${email.timestamp}`;
      document.querySelector('.body').innerHTML = email.body;

      // Remove existing archive button if present
      if (archiveButton) {
        archiveButton.remove();
      }

      // Create archive button
      archiveButton = document.createElement('button');
      archiveButton.innerHTML = email.archived ? "Unarchive" : "Archive";
      archiveButton.addEventListener('click', function () {
        fetch(`/emails/${email_id}`, {
          method: 'PUT',
          body: JSON.stringify({ archived: !email.archived })
        }).then(() => {
          load_mailbox(email.archived ? 'inbox' : 'archive');
        });
      });

      document.querySelector('#email-view').append(archiveButton);

      // **Remove existing reply button if present**
      let existingReplyButton = document.querySelector('#reply-button');
      if (existingReplyButton) {
        existingReplyButton.remove();
      }

      // **Create a new reply button**
      let replyButton = document.createElement('button');
      replyButton.id = 'reply-button';
      replyButton.innerHTML = "Reply";
      replyButton.addEventListener('click', function () {
        compose_email(email);
      });

      document.querySelector('#email-view').append(replyButton);
    });
}
