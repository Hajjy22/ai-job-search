/*
# Remove leftover invoice functions

1. Plain-English summary
Drops two helper functions from the old invoicing app. They are unused after the
invoice tables were removed and would only be dead weight.

2. Security
- SECURITY DEFINER functions callable surface reduced to zero.
*/

DROP FUNCTION IF EXISTS count_user_invoices(uuid);
DROP FUNCTION IF EXISTS next_invoice_number(uuid);