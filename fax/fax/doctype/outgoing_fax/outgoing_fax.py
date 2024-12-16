# Copyright (c) 2024, ItGetIt and contributors
# For license information, please see license.txt


import frappe
import requests
from frappe.model.document import Document

class OutgoingFax(Document):
	pass

def check_account():
	sender = frappe.qb.DocType('Fax Sender')
	q = (
		frappe.qb.from_(sender)
		.select(sender.connection_id, sender.from_fax_number, sender.api_key)
		.where(sender.user == frappe.session.user)
	)

	result = q.run(as_dict=True)

	if len(result) == 0:
		frappe.throw('No fax sender document exists. Please contact your administrator.')
	else:
		return result[0]

@frappe.whitelist()
def send_fax(doc_id):
	to, file_id = frappe.db.get_value('Outgoing Fax', doc_id, ['to', 'file_id'])
	file_doc = frappe.get_doc('File', file_id)  # get file id of attachment
	file_doc.is_private = 0 # set file to private
	file_doc.save()

	file_url = file_doc.file_url # get file url
	fax_sender = check_account()

	webhook_url = 'https://fax.hvgeek.com/api/method/telnyxWebhook'

	headers = {
		'Authorization': 'Bearer ' + fax_sender.api_key,
		'Content-Type': 'application/json'
	}

	payload = {
		'to': to.replace('-', ''),
		'media_url': 'https://fax.hvgeek.com' + requests.utils.quote(file_url),
		'webhook_url': webhook_url,
		'webhook_failover_url': webhook_url,
		'connection_id': fax_sender.connection_id,
		'from': fax_sender.from_fax_number.replace('-', ''),
	}

	response = requests.post('https://api.telnyx.com/v2/faxes', headers=headers, json=payload)

	if response.status_code == 202:
		response_data = response.json()
		data = response_data['data'] # get payload data
		of_doc = frappe.get_doc('Outgoing Fax', doc_id) # get fax doc
		of_doc.tracking_id = data['id'] # set tracking id
		of_doc.status = 'Queued'
		of_doc.date_queued = frappe.utils.get_datetime(data['created_at'][:-1])
		of_doc.date_delivered = None # reset dates
		of_doc.date_sent = None
		of_doc.save()

		return 'Fax sent successfully.'
	else:
		error_message = response.json()
		frappe.throw(f"Error sending fax: {error_message}")