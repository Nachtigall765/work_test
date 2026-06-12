USE akico_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    occupation VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE diagnosis_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,

    logic_score INT,
    empathy_score INT,
    challenge_score INT,
    careful_score INT,
    coop_score INT,
    lead_score INT,
    independent_score INT,
    honesty_score INT,
    stable_score INT,

    top_type VARCHAR(100),
    second_type VARCHAR(100),
    highest_point VARCHAR(100),
    highest_score INT,
    highest_comment TEXT,
    thinking_style TEXT,
    recommended_department VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
);

insert into users(
employee_id,
nickname,
occupation
)
values(
'EMP001',
'テストユーザー',
'臨床工学技士'
);
