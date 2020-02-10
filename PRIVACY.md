# LAMS Usage Reporting

Thank you for using LAMS. Looker would like to understand the demand for LAMS,
so that we can continue to enhance it and develop similar tools in the future.

If you wish to help us understand the demand for LAMS, we ask that you call
LAMS with the following options. This is optional.


	> lams --reporting=save-yes --report-license-key=AAA...AAA --report-user=bob@acme.com


Both license key and user are optional, but recommended. The information that
is sent to us includes:

  - License key (if provided): Your Looker license key. If the LookML repo to
    be linted is used by multiple Looker instances, please provide the license
    key from a production instance.
  - Email (if provided): Your email will be hashed before being sent to us. It
    may be used to associate your usage of LAMS with other activity or contact
    records that we have for you. If you prefer, you may provide your email
    pre-hashed. If so, please provide to_hex(sha256(utf8(lowercase(email)))).
  - Rule usage information: A count of linter messages for each rule id (e.g.,
    F2, F2), message level (e.g., error, warning, info), and exemption reason.
  - Error conditions associated with the execution of the script
  - Standard network & connection information such as IP address

The `reporting` option lets you specify your overall reporting preference:

  - `save-yes` - To run LAMS and opt-in to reporting for future runs
  - `yes`      - To run LAMS once with reporting
  - `no`       - To run LAMS once without reporting
  - `save-no`  - To run LAMS and opt-out of reporting for future runs

All preferences are saved in ~/.look-at-me-sideways
