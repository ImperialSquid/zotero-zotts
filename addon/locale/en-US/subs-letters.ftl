### Pronunciation fixes for non local letters

## Fixes for Greek letters

# Most are the same but some replacements are workaround for misinterpretations

# Forward the translation on to an engine specific handler
greek-fixed = { $engine ->
    *[other] { greek-default }
    [webSpeech] { greek-webSpeech }
}

# Perform any engine specific replacements,
# WSA often mistakes xi as Roman numerals 11, and chi as Chinese chi (CHEE)
# TODO: consider voice specific replacements for cases where multiple voices exist in the same locality?
greek-webSpeech = { $letter ->
    *[other] { greek-default }
    [greek-xi] ksai
    [greek-chi] kai
}

# If no engine specific replacements, or an incorrect engine, fallback to default replacement
greek-default = { $letter ->
    *[other] .
    [greek-alpha] alpha
    [greek-beta] beta
    [greek-gamma] gamma
    [greek-delta] delta
    [greek-epsilon] epsilon
    [greek-zeta] zeta
    [greek-eta] eta
    [greek-theta] theta
    [greek-iota] iota
    [greek-kappa] kappa
    [greek-lambda] lambda
    [greek-mu] mu
    [greek-nu] nu
    [greek-xi] xi
    [greek-omicron] omicron
    [greek-pi] pi
    [greek-rho] rho
    [greek-sigma] sigma
    [greek-tau] tau
    [greek-upsilon] upsilon
    [greek-phi] phi
    [greek-chi] chi
    [greek-psi] psi
    [greek-omega] omega
}

