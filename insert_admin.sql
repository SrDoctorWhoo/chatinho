INSERT INTO [User] (id, email, name, password, role, createdAt, updatedAt) 
VALUES (
    'clx' + CAST(CAST(RAND() * 1000000 AS INT) AS VARCHAR(20)), 
    'admin@admin.com', 
    'Administrador', 
    '$2b$10$4ei7AmKDf8nmQJuDqxXc.eGmCTK689KbDTux.cpxTocJJpWhi3IKy', 
    'ADMIN', 
    GETDATE(), 
    GETDATE()
);
