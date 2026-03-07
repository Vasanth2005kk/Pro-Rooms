from datetime import datetime

def roomidGen()->int:
    now = datetime.now()
    return int(str(now.strftime("%Y%m%d%f"))[2::])

