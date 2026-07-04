$cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=Buktiin" -CertStoreLocation "Cert:\CurrentUser\My" -KeyExportPolicy Exportable
$password = ConvertTo-SecureString -String "password123" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "d:\buktiin\desktop\dummy.pfx" -Password $password
