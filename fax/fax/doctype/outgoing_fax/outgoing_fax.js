// Copyright (c) 2024, ItGetIt and contributors
// For license information, please see license.txt
$("<style type='text/css'> .progress .shining { background: linear-gradient(90deg, rgb(0, 102, 146), #3ea8ff); background-size: 400% 400%; -webkit-animation: ShiningGradient 3s ease infinite; -moz-animation: ShiningGradient 3s ease infinite; animation: ShiningGradient 3s ease infinite; } @-webkit-keyframes ShiningGradient { 0%{background-position:0% 53%} 50%{background-position:100% 48%} 100%{background-position:0% 53%} } @-moz-keyframes ShiningGradient { 0%{background-position:0% 53%} 50%{background-position:100% 48%} 100%{background-position:0% 53%} } @keyframes ShiningGradient { 0%{background-position:0% 53%} 50%{background-position:100% 48%} 100%{background-position:0% 53%} } </style>").appendTo("head");
$('.page-actions').removeClass('justify-content-end').addClass('justify-content-start flex-row-reverse')

let send_button = '<i class="fa fa-paper-plane" aria-hidden="true"></i> Send Fax'
let resend_button = '<i class="fa fa-repeat" aria-hidden="true"></i> Resend Fax'

frappe.ui.form.on("Outgoing Fax", {
	refresh(frm) {
        const attach_field = frm.fields_dict['media_url']
        attach_field.on_attach_click = function () { 
            attach_field.set_upload_options()
            attach_field.upload_options.restrictions.allowed_file_types = ['application/pdf']
            attach_field.upload_options.make_attachments_public = 1
            attach_field.upload_options.restrictions.max_file_size = 70000000000
            attach_field.upload_options.restrictions.max_number_of_files = 1

            attach_field.file_uploader = new frappe.ui.FileUploader(attach_field.upload_options)
            attach_field.file_uploader.dialog.get_secondary_btn().hide()
            attach_field.file_uploader.dialog.get_secondary_btn().unbind()
            attach_field.file_uploader.dialog.get_primary_btn().click(function() {
            })
            attach_field.file_uploader.wrapper.lastChild.innerHTML.replace('<div data-v-d6847533=\"\" class=\"flex config-area\"><!--v-if--><label data-v-d6847533=\"\" class=\"frappe-checkbox\"><input data-v-d6847533=\"\" type=\"checkbox\">Private</label></div><div data-v-d6847533=\"\">', '')
        };

        const sendFax = (modalTitle) => {
            frappe.call(
                {
                    method: 'fax.fax.doctype.outgoing_fax.outgoing_fax.send_fax',
                    args: {
                        'doc_id': frm.doc.name
                    },
                    callback: function(response) {
                        frappe.show_alert({
                            message: 'Fax queued successfully!',
                            indicator:'green'
                        }, 5);
                    }
                } 
            )
        }

        if (frm.doc.status === 'Delivered') {
            frm.set_intro(`Fax was sent successfully on ${moment(frm.doc.date_sent).format('MMM DD, YYYY [at] hh:mm A')}`, 'green')
        }

        if (frm.doc.status === 'Failed') {
            frm.set_intro(`Fax failed to send on ${moment(frm.doc.date_sent).format('MMM DD, YYYY [at] hh:mm A')} because <b>${frm.doc.failure_reason}</b>`, 'red')
        }

        if (frm.doc.status === 'Created' && !frm.is_new()) {
            frm.add_custom_button(send_button, function() {
                sendFax('Sending Fax')
            }).attr('id', 'send-button').removeClass('btn-default').addClass('btn-info')
        }

        if (frm.doc.status === 'Delivered' || frm.doc.status === 'Failed') {
            frm.add_custom_button(resend_button, function() {
                sendFax('Resending Fax')
            }).attr('id', 'resend-button').removeClass('btn-default').addClass('btn-info')
        }
	},

    media_url(frm) {
        frm.remove_custom_button(send_button)
        frm.remove_custom_button(resend_button)
    },

    to(frm) {
        frm.remove_custom_button(send_button)
        frm.remove_custom_button(resend_button)
    },
});